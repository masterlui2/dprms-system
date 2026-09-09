"""Synthetic SETUP monitoring dataset generator.

DOST Davao Oriental cannot release historical monitoring records yet, so the
initial dataset is generated. Paper section 2.3.2.4 permits exactly this:

    "When sufficient historical labeled records are unavailable during initial
    development, representative DOST-structured monitoring observations may be
    used to test feature computation, Random Forest integration, TreeSHAP
    processing, and system output, but not to establish final predictive
    performance."

That last clause is binding. Every metric produced from this dataset validates
the *pipeline*, never the model's real-world accuracy.

Design decision: this module emits **raw quarterly-monitoring form primitives**
-- product lines and employee rows shaped to the columns DPRMS already
collects -- and then derives the five features through ``app.features``. It
does not fabricate feature values directly. Two things follow:

1. The same feature code path runs on synthetic and on real data, so swapping
   in DOST records later changes the data source and nothing else.
2. The raw output doubles as Laravel seed data, giving the demo consistent
   products, employees and baselines behind every prediction.

Run:  python -m training.generate_dataset
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from dataclasses import asdict, dataclass, field
from pathlib import Path

from app.features import (
    FEATURE_NAMES,
    ProductSale,
    employment_generated,
    man_months,
    percentage_increase_in_employment,
    percentage_increase_in_productivity,
    quarterly_gross_sales,
)
from app.features_extended import (
    EXTENDED_FEATURE_NAMES,
    ExtendedInputs,
    build_extended_vector,
)
from training.labeling import label_from_subsequent_quarter

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# --- Enterprise archetypes -------------------------------------------------
# Each archetype is a quarter-on-quarter Gross Sales growth process. The
# archetype persists across a project's whole monitoring history, which is what
# gives quarter t genuine information about quarter t+1 -- the model has
# something to learn beyond "t+1 resembles t".


@dataclass(frozen=True)
class Archetype:
    name: str
    weight: float
    #: Mean quarter-on-quarter sales growth, as a proportion.
    growth_mean: float
    #: Standard deviation of that growth.
    growth_sd: float
    #: Per-quarter drift applied to the mean, letting a trajectory bend over
    #: time (used by the recovering archetype).
    growth_drift: float = 0.0
    #: How strongly employment tracks cumulative sales performance.
    employment_elasticity: float = 0.45
    #: Typical workdays per employee per quarter, before noise. The schema caps
    #: this at 92 (StoreEmployeeRequest), and Form 008 treats 20 days as one
    #: man-month, so a full quarter is roughly 60-65 days.
    workdays_mean: float = 58.0
    workdays_sd: float = 6.0


# --- Realism controls ------------------------------------------------------
# Without these, archetype almost perfectly determines the outcome (an early
# run produced 0.0% At Risk for "growing" and 91.1% for "declining"). That
# separation is unrealistically clean: it reduces the classifier's task to
# recovering the archetype, which inflates every metric. Real MSMEs absorb
# shocks that cut across their underlying trajectory, so the generator injects
# them explicitly.

#: Probability per quarter that an enterprise takes an adverse shock
#: (equipment breakdown, lost buyer, typhoon disruption -- Davao Oriental is
#: typhoon-exposed, and Cateel and Baganga were severely hit by Pablo).
ADVERSE_SHOCK_PROB = 0.09

#: Multiplicative range applied to sales during an adverse shock.
ADVERSE_SHOCK_RANGE = (0.55, 0.80)

#: Probability per quarter of a favourable shock (new market, bulk order).
FAVOURABLE_SHOCK_PROB = 0.07
FAVOURABLE_SHOCK_RANGE = (1.15, 1.45)

#: Seasonal multipliers by quarter, typical of agri-processing MSMEs: a
#: harvest-driven Q2-Q3 lift and a softer Q1.
SEASONALITY = {1: 0.92, 2: 1.06, 3: 1.08, 4: 0.98}

#: Probability that a quarterly record is missing entirely -- late or skipped
#: submissions are ordinary in the real monitoring cycle. A gap makes the
#: surrounding observations ineligible, exactly as it would in production.
MISSING_QUARTER_PROB = 0.04

#: Multiplicative noise applied to each quarter's recorded sales, standing in
#: for encoding variance and timing differences.
RECORDING_NOISE_SD = 0.045


ARCHETYPES: tuple[Archetype, ...] = (
    Archetype("growing", weight=0.26, growth_mean=0.085, growth_sd=0.060,
              employment_elasticity=0.55, workdays_mean=62.0),
    Archetype("stable", weight=0.30, growth_mean=0.012, growth_sd=0.050,
              employment_elasticity=0.30, workdays_mean=59.0),
    Archetype("volatile", weight=0.16, growth_mean=0.020, growth_sd=0.210,
              employment_elasticity=0.50, workdays_mean=54.0, workdays_sd=11.0),
    Archetype("declining", weight=0.18, growth_mean=-0.090, growth_sd=0.070,
              employment_elasticity=0.60, workdays_mean=50.0, workdays_sd=9.0),
    Archetype("recovering", weight=0.10, growth_mean=-0.110, growth_sd=0.070,
              growth_drift=0.055, employment_elasticity=0.50, workdays_mean=55.0),
)

# --- Reference data for plausible-looking records --------------------------

PRODUCT_CATALOGUE = [
    ("Dried Mango Slices", "200g resealable pack", "pack"),
    ("Coconut Sugar", "500g jar", "jar"),
    ("Banana Chips", "150g pack", "pack"),
    ("Cacao Tablea", "12-piece box", "box"),
    ("Virgin Coconut Oil", "250ml bottle", "bottle"),
    ("Calamansi Concentrate", "350ml bottle", "bottle"),
    ("Woven Abaca Bag", "medium, natural finish", "piece"),
    ("Processed Seaweed Snack", "100g pack", "pack"),
    ("Smoked Fish (Tinapa)", "500g vacuum pack", "pack"),
    ("Peanut Butter", "340g jar", "jar"),
]

FIRST_NAMES = [
    "Maria", "Jose", "Ana", "Pedro", "Rosa", "Juan", "Grace", "Ramon", "Liza",
    "Nestor", "Divina", "Arnel", "Cecilia", "Bong", "Marilou", "Ricardo",
    "Jenny", "Efren", "Lorna", "Danilo",
]
LAST_NAMES = [
    "Dela Cruz", "Santos", "Reyes", "Bautista", "Gonzales", "Mendoza", "Torres",
    "Flores", "Ramos", "Aquino", "Castillo", "Villanueva", "Salazar", "Domingo",
]

EMPLOYMENT_STATUSES = ["Regular", "Contract-Based", "Part-Timer", "Project-Based"]
SECTORAL_GROUPS = ["None", "None", "None", "PWD", "Senior"]
GENDERS = ["Male", "Female"]

# Form 008: "Can be a cooperative, single ownership, partnership or corporation"
ORGANIZATION_TYPES = [
    "Single Ownership",
    "Single Ownership",
    "Partnership",
    "Cooperative",
    "Corporation",
]

MUNICIPALITIES = [
    "Mati City", "Baganga", "Cateel", "Boston", "Caraga", "Manay",
    "Tarragona", "Banaybanay", "Lupon", "San Isidro", "Governor Generoso",
]


# --- Emitted structures ----------------------------------------------------


@dataclass
class ProductRow:
    """Mirrors the `products` table."""

    product_name: str
    specifications: str
    unit: str
    price: float
    quantity: int


@dataclass
class EmployeeRow:
    """Mirrors the `employees` table, plus the employment_type column this
    plan adds so Equation 6's direct/indirect split survives persistence."""

    employee_name: str
    age: int
    status: str
    gender: str
    sectoral_group: str
    days_of_attendance: int
    salary_rate: float
    employment_type: str  # DIRECT | INDIRECT


@dataclass
class ProductionCostRow:
    """Mirrors the `production_costs` table."""

    particulars: str
    type: str  # OPERATION | LABOR | MISCELLANEOUS
    month_1: float
    month_2: float
    month_3: float

    @property
    def total(self) -> float:
        return self.month_1 + self.month_2 + self.month_3


@dataclass
class ProductionMaterialRow:
    """Mirrors the `production_materials` table."""

    materials: str
    unit: str
    quantity: int
    cost: float

    @property
    def total(self) -> float:
        return self.quantity * self.cost


@dataclass
class MarketRow:
    """Mirrors the `markets` table."""

    market_name: str
    address: str
    condition: str  # old | new
    effective_date: str
    contact_person: str
    service: str
    volume: str


@dataclass
class InterventionRow:
    """Mirrors the `interventions` table."""

    name: str
    type: str  # CONSULTANCY | TRAINING | TECHNOLOGY | TESTING | OTHERS
    availed: int
    intervention: str
    date: str


@dataclass
class NarrativeRow:
    """Mirrors the `narratives` table."""

    particular: str
    type: str  # PROBLEMS | PLANS
    intervention: str


@dataclass
class RepaymentLedgerRow:
    """Mirrors `project_ledgers` (repayment) plus its settling transaction.

    Repayment behaviour is the one genuinely *observed* outcome family
    available in DPRMS -- ``payment_date - payment_due`` is recorded fact, not
    a derived construct.
    """

    period_label: str
    amount: float
    due_date: str
    status: str  # pending | paid | overdue | completed
    amount_paid: float
    payment_date: str | None
    days_late: int | None


@dataclass
class QuarterRow:
    """Mirrors a `quarterly_metrics` row and its line items."""

    year: int
    quarter: int
    #: Days between the reporting deadline and actual submission. Negative
    #: values mean early. Feeds the compliance-behaviour feature.
    report_days_late: int = 0
    products: list[ProductRow] = field(default_factory=list)
    employees: list[EmployeeRow] = field(default_factory=list)
    production_costs: list[ProductionCostRow] = field(default_factory=list)
    production_materials: list[ProductionMaterialRow] = field(default_factory=list)
    markets: list[MarketRow] = field(default_factory=list)
    interventions: list[InterventionRow] = field(default_factory=list)
    narratives: list[NarrativeRow] = field(default_factory=list)
    repayments: list[RepaymentLedgerRow] = field(default_factory=list)


@dataclass
class BaselineRow:
    """Mirrors SETUP Form 008 -- Pre-implementation Project Information Sheet.

    Shaped to the actual DOST form rather than to what the model needs, because
    the same record is the project's baseline document for reporting.

    Only ONE field here feeds the classifier: ``total_employment_generated`` is
    EG_0 in Equation 7. Equations 4, 5, 6 and 8 read quarterly data exclusively.
    Everything else is captured for record-keeping and Form 008 reporting.

    Two details carried straight from the form:

    * ``total_employment_generated`` is stored as its own value rather than
      summed from the breakdown. The form has a dedicated Total Employment
      Generated cell, and the PWD / Senior Citizen rows are ambiguous as to
      whether they are additive or "of which" subsets -- summing them could
      inflate EG_0 and corrupt every Employment Increase value.
    * Gross sales and production volume are reckoned on a **semester** basis
      (Jan-Jun / Jul-Dec, whichever is closest to project approval), not
      quarterly. This is precisely why section 2.3.2.3.2 excludes the
      Pre-Implementation Gross Sales from Equation 5.
    """

    # --- Employment (Form 008: Total Employment Generated) ---
    #: EG_0 for Equation 7. The form defines employment in man-month-equivalent
    #: terms ("1 man-month (20 working days) = 1 employment"), whereas quarterly
    #: monitoring counts individual employees. Noted as a limitation.
    total_employment_generated: int
    direct_company_hire: int
    direct_subcontractor_hire: int
    indirect_backward: int
    indirect_forward: int

    # --- Total Assets ---
    asset_land: float
    asset_building: float
    asset_equipment: float
    asset_working_capital: float

    # --- Semestral production and sales, closest to project approval ---
    production_volume_local: float
    production_volume_export: float
    gross_sales_local: float
    gross_sales_export: float

    # --- Identity and dates ---
    year_firm_established: int
    date_assistance_approved: str
    organization_type: str

    @property
    def total_assets(self) -> float:
        return (
            self.asset_land
            + self.asset_building
            + self.asset_equipment
            + self.asset_working_capital
        )

    @property
    def total_gross_sales(self) -> float:
        """Form 008 Total Gross Sales = Local + Export."""
        return self.gross_sales_local + self.gross_sales_export


@dataclass
class ProjectRecord:
    project_code: str
    enterprise_name: str
    municipality: str
    archetype: str
    baseline: BaselineRow
    quarters: list[QuarterRow]


def _weighted_archetype(rng: random.Random) -> Archetype:
    return rng.choices(ARCHETYPES, weights=[a.weight for a in ARCHETYPES], k=1)[0]


def _make_products(
    rng: random.Random,
    target_sales: float,
    catalogue: list[tuple[str, str, str]],
) -> list[ProductRow]:
    """Build product lines whose price x quantity sums to about ``target_sales``.

    Generating lines that *multiply out* to the target -- rather than writing
    the total directly -- is the point: Equation 4 then has real line items to
    sum, exactly as it will on production data.
    """
    n_lines = rng.randint(1, min(4, len(catalogue)))
    chosen = rng.sample(catalogue, n_lines)

    # Split the target across lines using random proportions.
    weights = [rng.uniform(0.5, 1.5) for _ in range(n_lines)]
    total_weight = sum(weights)

    rows: list[ProductRow] = []
    for (name, spec, unit), weight in zip(chosen, weights):
        line_target = target_sales * (weight / total_weight)
        price = float(rng.choice([45, 60, 75, 90, 120, 150, 180, 220, 250, 300]))
        quantity = max(1, round(line_target / price))
        rows.append(
            ProductRow(
                product_name=name,
                specifications=spec,
                unit=unit,
                price=price,
                quantity=quantity,
            )
        )
    return rows


def _make_employees(
    rng: random.Random,
    direct_count: int,
    indirect_count: int,
    archetype: Archetype,
    health: float = 0.0,
) -> list[EmployeeRow]:
    """Build employee rows with per-person workdays feeding Equation 8.

    Employment *status* composition tracks enterprise condition: a firm under
    pressure shifts regular staff toward contractual, part-time and
    project-based arrangements while headcount may hold flat. Equation 6
    counts heads and cannot see that substitution, which is precisely why the
    extended set carries ``regular_employment_ratio``.
    """
    # Healthy: ~55% regular. Distressed: ~15%.
    regular_share = max(0.10, min(0.35 + 0.20 * health, 0.75))
    rows: list[EmployeeRow] = []
    for employment_type, count in (("DIRECT", direct_count), ("INDIRECT", indirect_count)):
        for _ in range(count):
            workdays = round(rng.gauss(archetype.workdays_mean, archetype.workdays_sd))
            # Column constraint in StoreEmployeeRequest: 0..92.
            workdays = max(0, min(92, workdays))
            status = (
                "Regular" if rng.random() < regular_share
                else rng.choice(["Contract-Based", "Part-Timer", "Project-Based"])
            )
            rows.append(
                EmployeeRow(
                    employee_name=f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
                    age=rng.randint(18, 62),
                    status=status,
                    gender=rng.choice(GENDERS),
                    sectoral_group=rng.choice(SECTORAL_GROUPS),
                    days_of_attendance=workdays,
                    salary_rate=float(rng.choice([420, 450, 480, 500, 550, 600])),
                    employment_type=employment_type,
                )
            )
    return rows


def _health_index(growth: float, cumulative_growth: float, shock: float) -> float:
    """Latent enterprise condition for a quarter, in roughly [-1, 1].

    **This is the anti-circularity mechanism.** Every extended feature is
    generated from this latent condition -- never from the eventual label. In
    reality, a struggling enterprise simultaneously shows margin compression,
    late reports, missed repayments and more recorded problems, because all of
    them are consequences of the same underlying condition. Generating them
    that way reproduces genuine co-movement. Generating them from the label
    instead would leak the answer into the inputs and let the classifier score
    well while learning nothing about the domain.
    """
    raw = 4.0 * growth + 1.5 * cumulative_growth + 2.0 * (shock - 1.0)
    return max(-1.0, min(raw, 1.0))


def _make_production_costs(
    rng: random.Random, gross_sales: float, health: float
) -> list[ProductionCostRow]:
    """Cost lines whose total sits at a health-dependent share of sales.

    Healthy enterprises run near a 50% cost ratio; distressed ones approach or
    exceed parity with sales, which is exactly the margin compression the
    extended feature set is meant to detect.
    """
    cost_ratio = 0.68 - 0.18 * health + rng.gauss(0.0, 0.06)
    cost_ratio = max(0.25, min(cost_ratio, 1.35))
    total_cost = gross_sales * cost_ratio

    # Labour share widens under distress: staff costs persist while sales fall.
    labor_share = 0.34 - 0.08 * health + rng.gauss(0.0, 0.04)
    labor_share = max(0.15, min(labor_share, 0.62))
    misc_share = rng.uniform(0.05, 0.14)
    operation_share = max(0.05, 1.0 - labor_share - misc_share)

    def split_into_months(amount: float) -> tuple[float, float, float]:
        weights = [rng.uniform(0.8, 1.2) for _ in range(3)]
        total_weight = sum(weights)
        return tuple(round(amount * w / total_weight, 2) for w in weights)  # type: ignore[return-value]

    rows: list[ProductionCostRow] = []
    for particulars, cost_type, share in (
        ("Utilities and operating expenses", "OPERATION", operation_share),
        ("Wages and labor", "LABOR", labor_share),
        ("Miscellaneous", "MISCELLANEOUS", misc_share),
    ):
        m1, m2, m3 = split_into_months(total_cost * share)
        rows.append(
            ProductionCostRow(
                particulars=particulars, type=cost_type,
                month_1=m1, month_2=m2, month_3=m3,
            )
        )
    return rows


def _make_production_materials(
    rng: random.Random, gross_sales: float, health: float
) -> list[ProductionMaterialRow]:
    """Raw material lines; input costs bite harder when health is poor."""
    material_ratio = max(0.10, min(0.30 - 0.06 * health + rng.gauss(0.0, 0.04), 0.55))
    budget = gross_sales * material_ratio

    catalogue = [
        ("Fresh fruit", "kg"), ("Sugar", "kg"), ("Packaging film", "roll"),
        ("Cooking oil", "litre"), ("Labels", "piece"), ("Coconut", "piece"),
    ]
    chosen = rng.sample(catalogue, rng.randint(2, 4))
    weights = [rng.uniform(0.6, 1.4) for _ in chosen]
    total_weight = sum(weights)

    rows: list[ProductionMaterialRow] = []
    for (name, unit), weight in zip(chosen, weights):
        line_budget = budget * (weight / total_weight)
        unit_cost = float(rng.choice([25, 40, 55, 70, 95, 130]))
        rows.append(
            ProductionMaterialRow(
                materials=name, unit=unit,
                quantity=max(1, round(line_budget / unit_cost)), cost=unit_cost,
            )
        )
    return rows


def _make_markets(
    rng: random.Random, health: float, municipality: str, year: int
) -> list[MarketRow]:
    """Market outlets. Healthy enterprises diversify; struggling ones lose buyers."""
    count = max(1, round(3.0 + 2.2 * health + rng.gauss(0.0, 0.9)))
    rows: list[MarketRow] = []
    for i in range(count):
        # New outlets appear far more often when the enterprise is doing well.
        is_new = rng.random() < max(0.05, 0.30 + 0.25 * health)
        rows.append(
            MarketRow(
                market_name=f"{rng.choice(['Sari-Sari Network', 'Pasalubong Center', 'Supermarket', 'Cooperative Store', 'Online Reseller', 'Hotel Supplier'])} {i + 1}",
                address=municipality,
                condition="new" if is_new else "old",
                effective_date=f"{year}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}",
                contact_person=f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
                service=rng.choice(["Retail distribution", "Wholesale", "Consignment"]),
                volume=f"{rng.randint(50, 900)} units",
            )
        )
    return rows


def _make_interventions(
    rng: random.Random, health: float, year: int, quarter: int
) -> list[InterventionRow]:
    """DOST assistance availed during the quarter.

    Weakly *increases* under distress: DOST tends to step in when an
    enterprise struggles. That inverts the naive assumption and is worth the
    model learning.
    """
    count = max(0, round(0.8 - 0.5 * health + rng.gauss(0.0, 0.7)))
    types = ["CONSULTANCY", "TRAINING", "TECHNOLOGY", "TESTING", "OTHERS"]
    rows: list[InterventionRow] = []
    for _ in range(count):
        intervention_type = rng.choice(types)
        rows.append(
            InterventionRow(
                name=rng.choice([
                    "Packaging design assistance", "Food safety training",
                    "Equipment calibration", "Shelf life testing",
                    "Productivity consultancy", "Market linkage assistance",
                ]),
                type=intervention_type,
                availed=1,
                intervention=rng.choice(["Process", "Packaging/Labeling", "Marketing", "Quality control"]),
                date=f"{year}-{(quarter - 1) * 3 + rng.randint(1, 3):02d}-{rng.randint(1, 28):02d}",
            )
        )
    return rows


def _make_narratives(rng: random.Random, health: float) -> list[NarrativeRow]:
    """Problems and plans recorded on the quarterly report.

    Only the *count* of problems becomes a feature. Section 2.3.2.3 keeps
    narrative content as SSCP Focal context, excluded from the vector.
    """
    problem_count = max(0, round(1.4 - 2.0 * health + rng.gauss(0.0, 0.6)))
    problems = [
        "Rising raw material cost", "Delayed buyer payments", "Equipment downtime",
        "Labor shortage", "Reduced customer demand", "Supply disruption",
        "Difficulty meeting repayment schedule", "Packaging supply delay",
    ]
    actions = [
        "Sourcing alternative suppliers", "Renegotiating terms",
        "Scheduling preventive maintenance", "Recruiting additional workers",
        "Expanding promotional activities", "Requesting DOST assistance",
    ]
    rows = [
        NarrativeRow(particular=p, type="PROBLEMS", intervention=rng.choice(actions))
        for p in rng.sample(problems, min(problem_count, len(problems)))
    ]
    for plan in rng.sample(
        ["Expand product line", "Enter new market", "Upgrade equipment", "Improve packaging"],
        rng.randint(1, 2),
    ):
        rows.append(NarrativeRow(particular=plan, type="PLANS", intervention="Planned next quarter"))
    return rows


def _make_repayment(
    rng: random.Random, health: float, amortization: float, year: int, quarter: int
) -> RepaymentLedgerRow:
    """One quarter's repayment obligation and how it was actually settled.

    Distress shows up here as lateness, partial payment, and eventually
    non-payment -- the observed signal that makes this family valuable.
    """
    due_month = quarter * 3
    due_date = f"{year}-{due_month:02d}-15"

    # Probability of default rises steeply as health falls.
    default_prob = max(0.01, min(0.45 - 0.38 * health, 0.85))

    if rng.random() < default_prob:
        # Missed entirely this quarter.
        return RepaymentLedgerRow(
            period_label=f"Q{quarter} {year}", amount=round(amortization, 2),
            due_date=due_date, status="overdue",
            amount_paid=0.0, payment_date=None, days_late=None,
        )

    # Paid, but lateness scales with distress.
    days_late = max(0, round(rng.gauss(6.0 - 14.0 * health, 9.0)))
    paid_ratio = 1.0 if rng.random() > max(0.02, 0.18 - 0.15 * health) else rng.uniform(0.4, 0.9)
    pay_day = min(28, 15 + days_late % 14)
    pay_month = min(12, due_month + days_late // 30)

    return RepaymentLedgerRow(
        period_label=f"Q{quarter} {year}", amount=round(amortization, 2),
        due_date=due_date, status="paid",
        amount_paid=round(amortization * paid_ratio, 2),
        payment_date=f"{year}-{pay_month:02d}-{pay_day:02d}",
        days_late=days_late,
    )


def generate_project(rng: random.Random, index: int, start_year: int) -> ProjectRecord:
    """Generate one MSME's Form 008 baseline and full quarterly history."""
    archetype = _weighted_archetype(rng)

    # Form 008 employment breakdown. Company hire dominates; sub-contractor and
    # indirect (backward/forward) employment are smaller and often zero.
    direct_company = rng.randint(3, 14)
    direct_subcontractor = rng.randint(0, 4)
    indirect_backward = rng.randint(0, 4)
    indirect_forward = rng.randint(0, 3)
    baseline_employment = (
        direct_company + direct_subcontractor + indirect_backward + indirect_forward
    )

    # Quarterly sales scale drives the trajectory; the Form 008 figure is the
    # SEMESTRAL total closest to project approval, so roughly two quarters.
    quarterly_sales_scale = float(rng.randint(60, 450) * 1000)
    semestral_local = quarterly_sales_scale * rng.uniform(1.85, 2.15)
    # Most Davao Oriental SETUP MSMEs sell domestically; exports are the exception.
    semestral_export = (
        semestral_local * rng.uniform(0.05, 0.35) if rng.random() < 0.18 else 0.0
    )

    n_quarters = rng.randint(4, 8)
    municipality = rng.choice(MUNICIPALITIES)

    # SETUP is a refund programme: the approved project cost is repaid on a
    # schedule. Amortisation is sized against the enterprise's sales so the
    # burden is proportionate rather than arbitrary.
    approved_project_cost = quarterly_sales_scale * rng.uniform(1.2, 3.5)
    quarterly_amortization = approved_project_cost / rng.choice([8, 10, 12])

    # Sales level walks forward from the baseline under the archetype process.
    sales_level = quarterly_sales_scale * rng.uniform(0.95, 1.20)
    cumulative_growth = 0.0

    quarters: list[QuarterRow] = []
    catalogue = rng.sample(PRODUCT_CATALOGUE, rng.randint(3, 5))

    year, quarter = start_year, 1
    for step in range(n_quarters):
        growth = rng.gauss(
            archetype.growth_mean + archetype.growth_drift * step,
            archetype.growth_sd,
        )

        # Idiosyncratic shocks cut across the archetype, so a "growing"
        # enterprise can still land in trouble and a "declining" one can catch
        # a reprieve. This is what stops archetype from being destiny.
        shock = 1.0
        if rng.random() < ADVERSE_SHOCK_PROB:
            shock *= rng.uniform(*ADVERSE_SHOCK_RANGE)
        if rng.random() < FAVOURABLE_SHOCK_PROB:
            shock *= rng.uniform(*FAVOURABLE_SHOCK_RANGE)

        sales_level = max(20_000.0, sales_level * (1.0 + growth) * shock)
        cumulative_growth += growth

        # Skipped or late submissions happen; a gap makes the neighbouring
        # observations ineligible, exactly as it would in production.
        if step not in (0, n_quarters - 1) and rng.random() < MISSING_QUARTER_PROB:
            quarter += 1
            if quarter > 4:
                quarter = 1
                year += 1
            continue

        # Recorded sales carry seasonality and encoding noise on top of the
        # underlying level.
        recorded_sales = max(
            5_000.0,
            sales_level
            * SEASONALITY[quarter]
            * rng.gauss(1.0, RECORDING_NOISE_SD),
        )

        # Employment tracks cumulative performance, stickily and with a floor.
        # The shock feeds through partially: firms shed labour more slowly than
        # they lose sales.
        shock_passthrough = 1.0 + (shock - 1.0) * 0.35
        employment_target = baseline_employment * (
            1.0 + archetype.employment_elasticity * cumulative_growth
        ) * shock_passthrough
        employment_target *= rng.uniform(0.90, 1.10)
        total_employment = max(1, round(employment_target))

        # Preserve roughly the baseline's direct/indirect mix.
        indirect_share = (
            (indirect_backward + indirect_forward) / baseline_employment
            if baseline_employment
            else 0.0
        )
        indirect_count = min(total_employment - 1, round(total_employment * indirect_share))
        indirect_count = max(0, indirect_count)
        direct_count = total_employment - indirect_count

        # Latent condition drives every extended feature for this quarter.
        health = _health_index(growth, cumulative_growth, shock)


        # Compliance behaviour: healthy enterprises file on time or early;
        # struggling ones slip. Often the strongest signal in the extended set.
        report_late = round(rng.gauss(-1.0 - 13.0 * health, 6.0))

        quarters.append(
            QuarterRow(
                year=year,
                quarter=quarter,
                report_days_late=report_late,
                products=_make_products(rng, recorded_sales, catalogue),
                employees=_make_employees(
                    rng, direct_count, indirect_count, archetype, health
                ),
                production_costs=_make_production_costs(rng, recorded_sales, health),
                production_materials=_make_production_materials(rng, recorded_sales, health),
                markets=_make_markets(rng, health, municipality, year),
                interventions=_make_interventions(rng, health, year, quarter),
                narratives=_make_narratives(rng, health),
                repayments=[
                    _make_repayment(rng, health, quarterly_amortization, year, quarter)
                ],
            )
        )

        quarter += 1
        if quarter > 4:
            quarter = 1
            year += 1

    return ProjectRecord(
        project_code=f"SETUP-{index:04d}",
        enterprise_name=f"{rng.choice(LAST_NAMES)} {rng.choice(['Food Products', 'Enterprises', 'Agri-Ventures', 'Handicrafts', 'Trading'])}",
        municipality=municipality,
        archetype=archetype.name,
        baseline=BaselineRow(
            total_employment_generated=baseline_employment,
            direct_company_hire=direct_company,
            direct_subcontractor_hire=direct_subcontractor,
            indirect_backward=indirect_backward,
            indirect_forward=indirect_forward,
            asset_land=float(rng.randint(0, 2500) * 1000),
            asset_building=float(rng.randint(150, 3000) * 1000),
            asset_equipment=float(rng.randint(200, 4000) * 1000),
            asset_working_capital=float(rng.randint(50, 1200) * 1000),
            production_volume_local=float(rng.randint(500, 9000)),
            production_volume_export=(
                float(rng.randint(50, 1200)) if semestral_export else 0.0
            ),
            gross_sales_local=round(semestral_local, 2),
            gross_sales_export=round(semestral_export, 2),
            year_firm_established=start_year - rng.randint(2, 25),
            date_assistance_approved=f"{start_year - 1}-{rng.randint(9, 12):02d}-{rng.randint(1, 28):02d}",
            organization_type=rng.choice(ORGANIZATION_TYPES),
        ),
        quarters=quarters,
    )


def derive_extended_features(
    quarter: QuarterRow,
    history: list[QuarterRow],
    baseline: BaselineRow,
) -> dict[str, float]:
    """Build the extended vector for one quarter from its raw rows.

    ``history`` is the run of quarters up to and including this one; only past
    and present are ever read, preserving the prediction-time boundary.
    """
    gross_sales = quarterly_gross_sales(
        [ProductSale(p.price, p.quantity) for p in quarter.products]
    )
    total_cost = sum(c.total for c in quarter.production_costs)
    labor_cost = sum(c.total for c in quarter.production_costs if c.type == "LABOR")
    material_cost = sum(m.total for m in quarter.production_materials)

    # Repayment history to date -- observed behaviour, not inference.
    settled: list[int] = []
    overdue = 0
    paid_amount = 0.0
    due_amount = 0.0
    for past in history:
        for ledger in past.repayments:
            due_amount += ledger.amount
            paid_amount += ledger.amount_paid
            if ledger.status == "overdue":
                overdue += 1
            elif ledger.days_late is not None:
                settled.append(ledger.days_late)

    recent_sales = [
        quarterly_gross_sales([ProductSale(p.price, p.quantity) for p in q.products])
        for q in history[-4:]
    ]

    regular = sum(1 for e in quarter.employees if e.status == "Regular")
    total_workdays = sum(e.days_of_attendance for e in quarter.employees)

    inputs = ExtendedInputs(
        gross_sales=gross_sales,
        total_production_cost=total_cost,
        labor_cost=labor_cost,
        material_cost=material_cost,
        repayment_days_late_values=settled,
        repayment_overdue_entries=overdue,
        repayment_amount_paid=paid_amount,
        repayment_amount_due_to_date=due_amount,
        recent_gross_sales=recent_sales,
        baseline_semestral_gross_sales=baseline.total_gross_sales,
        regular_employee_count=regular,
        total_employee_count=len(quarter.employees),
        total_workdays=float(total_workdays),
        active_markets=len(quarter.markets),
        interventions_availed=sum(1 for i in quarter.interventions if i.availed),
        report_days_late_value=quarter.report_days_late,
        problems_reported=sum(1 for n in quarter.narratives if n.type == "PROBLEMS"),
    )
    return dict(
        zip(EXTENDED_FEATURE_NAMES, build_extended_vector(inputs))
    )


def _is_consecutive(earlier: QuarterRow, later: QuarterRow) -> bool:
    """True when ``later`` is the calendar quarter immediately after ``earlier``.

    Equation 5 is defined over *consecutive* quarterly Gross Sales values. Once
    the generator can skip a quarter (late or missing submission), adjacency in
    the list no longer implies adjacency in time, so this has to be checked
    rather than assumed. The same guard is required in the Laravel service.
    """
    return (later.year - earlier.year) * 4 + (later.quarter - earlier.quarter) == 1


def derive_quarter_features(
    quarter: QuarterRow,
    previous: QuarterRow | None,
    baseline_employment: int,
) -> dict[str, float | None]:
    """Run one quarter's raw rows through the paper's Equations 4-8."""
    gross_sales = quarterly_gross_sales(
        [ProductSale(p.price, p.quantity) for p in quarter.products]
    )
    previous_sales = (
        quarterly_gross_sales(
            [ProductSale(p.price, p.quantity) for p in previous.products]
        )
        if previous is not None
        else None
    )
    direct = sum(1 for e in quarter.employees if e.employment_type == "DIRECT")
    indirect = sum(1 for e in quarter.employees if e.employment_type == "INDIRECT")
    eg = employment_generated(direct, indirect)

    return {
        "gross_sales": gross_sales,
        "productivity_increase": percentage_increase_in_productivity(
            gross_sales, previous_sales
        ),
        "employment_generated": eg,
        "employment_increase": percentage_increase_in_employment(
            eg, baseline_employment
        ),
        "man_months": man_months([e.days_of_attendance for e in quarter.employees]),
    }


def build_observations(projects: list[ProjectRecord]) -> list[dict]:
    """Turn projects into labelled training observations.

    An observation exists at quarter *t* only when both neighbours exist:

    * quarter *t-1* is required for Percentage Increase in Productivity
      (Equation 5), which is why the first assessment falls after Q2
      (section 2.3.2.2);
    * quarter *t+1* is required to derive the outcome label, and is never
      exposed as a feature -- that is the prediction-time boundary.
    """
    observations: list[dict] = []

    for project in projects:
        # EG_0 is Form 008's own Total Employment Generated cell -- see the
        # note on BaselineRow about why this is not re-summed here.
        baseline_employment = project.baseline.total_employment_generated
        quarters = project.quarters

        computed = [
            derive_quarter_features(
                quarters[i],
                quarters[i - 1]
                if i > 0 and _is_consecutive(quarters[i - 1], quarters[i])
                else None,
                baseline_employment,
            )
            for i in range(len(quarters))
        ]

        for i in range(1, len(quarters) - 1):
            # The label reads quarter t+1, so it must genuinely be the next
            # calendar quarter -- a gap would mean labelling t from a quarter
            # six months later.
            if not _is_consecutive(quarters[i], quarters[i + 1]):
                continue

            current, nxt = computed[i], computed[i + 1]

            # Both quarters must have a defined productivity change.
            if current["productivity_increase"] is None or nxt["productivity_increase"] is None:
                continue
            if current["employment_increase"] is None or nxt["employment_increase"] is None:
                continue

            decision = label_from_subsequent_quarter(
                productivity_increase_next=nxt["productivity_increase"],
                employment_increase_next=nxt["employment_increase"],
                man_months_next=nxt["man_months"],
                man_months_current=current["man_months"],
                productivity_increase_current=current["productivity_increase"],
            )

            observations.append(
                {
                    "project_code": project.project_code,
                    "archetype": project.archetype,
                    "year": quarters[i].year,
                    "quarter": quarters[i].quarter,
                    **{name: current[name] for name in FEATURE_NAMES},
                    **derive_extended_features(
                        quarters[i], quarters[: i + 1], project.baseline
                    ),
                    "label": decision.label,
                    "outcome": decision.outcome_name,
                    "triggered": "|".join(decision.triggered),
                }
            )

    return observations


def summarise(observations: list[dict], projects: list[ProjectRecord]) -> str:
    total = len(observations)
    at_risk = sum(o["label"] for o in observations)
    lines = [
        "SETUP synthetic monitoring dataset",
        "=" * 60,
        f"Projects (MSMEs)       : {len(projects)}",
        f"Quarterly records      : {sum(len(p.quarters) for p in projects)}",
        f"Eligible observations  : {total}",
        "",
        "Class distribution (paper Table 8):",
        f"  0  No Risk Flag / Routine Monitoring            : "
        f"{total - at_risk:5d}  ({(total - at_risk) / total:6.1%})",
        f"  1  At Risk / Additional Review or Follow-up     : "
        f"{at_risk:5d}  ({at_risk / total:6.1%})",
        "",
        "At Risk rate by enterprise archetype:",
    ]
    for arch in ARCHETYPES:
        subset = [o for o in observations if o["archetype"] == arch.name]
        if subset:
            rate = sum(o["label"] for o in subset) / len(subset)
            lines.append(f"  {arch.name:<12} n={len(subset):4d}   at risk {rate:6.1%}")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--projects", type=int, default=200)
    parser.add_argument("--seed", type=int, default=20260909)
    parser.add_argument("--start-year", type=int, default=2022)
    parser.add_argument("--out-dir", type=Path, default=DATA_DIR)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    projects = [
        generate_project(rng, i + 1, args.start_year) for i in range(args.projects)
    ]
    observations = build_observations(projects)

    args.out_dir.mkdir(parents=True, exist_ok=True)

    # Raw form primitives -- also the Laravel seeder's input.
    raw_path = args.out_dir / "raw_records.json"
    raw_path.write_text(
        json.dumps(
            {
                "generator_seed": args.seed,
                "projects": [asdict(p) for p in projects],
            },
            indent=2,
        )
    )

    # Labelled observations -- the training table.
    obs_path = args.out_dir / "observations.csv"
    with obs_path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(observations[0].keys()))
        writer.writeheader()
        writer.writerows(observations)

    print(summarise(observations, projects))
    print()
    print(f"raw records  -> {raw_path}")
    print(f"observations -> {obs_path}")


if __name__ == "__main__":
    main()
