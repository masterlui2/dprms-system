"""Extended SETUP monitoring features.

``app.features`` holds the five indicators the capstone paper mandates
(section 2.3.2.3, Equations 4-8). That set is fixed and must not change.

This module adds an **extended** set drawn from data DPRMS already collects
but the paper's initial vector excludes. Two reasons to have it:

1. **Random Forest needs breadth to be the right tool.** With five features --
   two of which are derived from the other two -- there are roughly three
   independent signals, and the ensemble's advantage over a single tuned tree
   is thin. A reviewer can fairly ask why an ensemble was chosen. With the
   extended set the answer is structural rather than rhetorical.
2. **Financial, repayment and compliance behaviour carry real signal.** Margin
   compression precedes distress; repayment lateness is an *observed* outcome
   rather than an inferred one; and in government monitoring programmes an
   enterprise that stops reporting on time is frequently already in trouble.

Both sets are trained and reported separately, so the paper's mandated model
stands on its own and the extended model is presented as an enhancement.

**Anti-circularity discipline.** Every feature here is computed from the
enterprise's recorded state at quarter *t*. None is derived from the label,
which comes from quarter *t+1*. When these features are synthesised for
training, they must likewise be generated from the enterprise's latent
condition and never from its eventual label -- otherwise the classifier learns
the generator instead of the domain.

All computations degrade to a documented neutral value rather than raising,
because unlike the mandated five these are enhancements: a project missing
market records should still receive an assessment.
"""

from __future__ import annotations

from dataclasses import dataclass
from statistics import fmean, pstdev
from typing import Sequence

from app.features import FEATURE_NAMES as CORE_FEATURE_NAMES
from app.features import WORKING_DAYS_PER_MAN_MONTH

# Ordering is contractual, exactly as for the core set: the trained model
# indexes positionally, so reordering invalidates persisted artifacts.
EXTENDED_FEATURE_NAMES: tuple[str, ...] = (
    # --- Financial health: margin compression precedes distress ---
    "cost_to_sales_ratio",
    "gross_margin",
    "labor_cost_share",
    "material_cost_ratio",
    # --- Repayment behaviour: observed, not inferred ---
    "repayment_days_late",
    "repayment_overdue_count",
    "repayment_completion_ratio",
    # --- Sales dynamics: momentum and stability, not just last change ---
    "sales_trend_3q",
    "sales_volatility",
    "sales_vs_baseline_ratio",
    # --- Employment quality: precarity and underemployment ---
    "regular_employment_ratio",
    "avg_workdays_per_employee",
    # --- Market position and DOST support ---
    "market_count",
    "interventions_availed_count",
    # --- Compliance behaviour ---
    "report_days_late",
    "problems_reported_count",
)

#: The full feature space: the paper's mandated five, then the extended set.
ALL_FEATURE_NAMES: tuple[str, ...] = CORE_FEATURE_NAMES + EXTENDED_FEATURE_NAMES

FEATURE_LABELS: dict[str, str] = {
    "cost_to_sales_ratio": "Cost-to-Sales Ratio",
    "gross_margin": "Gross Margin",
    "labor_cost_share": "Labor Cost Share",
    "material_cost_ratio": "Material Cost Ratio",
    "repayment_days_late": "Repayment Days Late",
    "repayment_overdue_count": "Overdue Repayments",
    "repayment_completion_ratio": "Repayment Completion",
    "sales_trend_3q": "Sales Trend (3 Quarters)",
    "sales_volatility": "Sales Volatility",
    "sales_vs_baseline_ratio": "Sales vs Baseline",
    "regular_employment_ratio": "Regular Employment Share",
    "avg_workdays_per_employee": "Average Workdays per Employee",
    "market_count": "Active Markets",
    "interventions_availed_count": "DOST Interventions Availed",
    "report_days_late": "Report Submission Delay",
    "problems_reported_count": "Problems Reported",
}


# --- Financial health ------------------------------------------------------


def cost_to_sales_ratio(total_production_cost: float, gross_sales: float) -> float:
    """Total production cost as a proportion of quarterly Gross Sales.

    Source: ``production_costs.total`` summed for the quarter over
    ``products.gross_sales`` summed for the quarter.

    Rising above 1.0 means the enterprise spent more producing than it sold --
    a direct solvency signal that the mandated five cannot express. Capped at
    a finite value so a zero-sales quarter cannot produce an infinity.
    """
    if gross_sales <= 0:
        return 5.0  # Sentinel: no sales recorded against non-zero cost.
    return min(total_production_cost / gross_sales, 5.0)


def gross_margin(total_production_cost: float, gross_sales: float) -> float:
    """(Gross Sales - Production Cost) / Gross Sales.

    Negative margin means the quarter ran at a loss. Bounded below so a
    catastrophic quarter does not dominate tree splits.
    """
    if gross_sales <= 0:
        return -1.0
    return max((gross_sales - total_production_cost) / gross_sales, -1.0)


def labor_cost_share(labor_cost: float, total_production_cost: float) -> float:
    """LABOR-type production cost as a share of total production cost.

    Source: ``production_costs`` rows where ``type = 'LABOR'``.

    A rising labour share against falling sales indicates an enterprise
    carrying staff it can no longer support from revenue.
    """
    if total_production_cost <= 0:
        return 0.0
    return min(labor_cost / total_production_cost, 1.0)


def material_cost_ratio(material_cost: float, gross_sales: float) -> float:
    """Raw material spend as a proportion of Gross Sales.

    Source: ``production_materials.total`` summed for the quarter. Input-cost
    inflation shows up here before it reaches the margin.
    """
    if gross_sales <= 0:
        return 5.0
    return min(material_cost / gross_sales, 5.0)


# --- Repayment behaviour ---------------------------------------------------


def repayment_days_late(days_late_values: Sequence[int]) -> float:
    """Mean days late across repayments settled up to this quarter.

    Source: ``repayment_transactions.payment_date - payment_due``.

    This is the most valuable feature family available, because repayment
    lateness is *recorded fact* rather than a derived construct. Early payments
    are floored at zero: paying ahead is not evidence of distress, and letting
    it go negative would let a single early payment offset genuine lateness.
    """
    if not days_late_values:
        return 0.0
    return float(fmean(max(0, d) for d in days_late_values))


def repayment_overdue_count(overdue_ledger_entries: int) -> int:
    """Count of repayment ledger entries currently marked overdue.

    Source: ``project_ledgers`` where ``ledger_type = 'repayment'`` and
    ``status = 'overdue'``, restricted to due dates on or before this quarter.
    """
    return int(overdue_ledger_entries)


def repayment_completion_ratio(amount_paid: float, amount_due_to_date: float) -> float:
    """Proportion of the amount scheduled to date that has actually been paid.

    1.0 means fully current. Values below 1.0 quantify the shortfall, which is
    a more graded signal than the binary overdue flag.
    """
    if amount_due_to_date <= 0:
        return 1.0  # Nothing scheduled yet: treated as current.
    return min(amount_paid / amount_due_to_date, 1.0)


# --- Sales dynamics --------------------------------------------------------


def sales_trend_3q(recent_gross_sales: Sequence[float]) -> float:
    """Ordinary-least-squares slope of Gross Sales over recent quarters,
    normalised by mean sales to give a comparable rate across enterprise sizes.

    Percentage Increase in Productivity (Equation 5) sees only the last
    step, so a steady three-quarter slide and a one-off dip look identical to
    it. This separates them.

    Returns 0.0 when fewer than two quarters are available.
    """
    values = [float(v) for v in recent_gross_sales]
    n = len(values)
    if n < 2:
        return 0.0

    mean_x = (n - 1) / 2.0
    mean_y = fmean(values)
    denominator = sum((i - mean_x) ** 2 for i in range(n))
    if denominator == 0 or mean_y == 0:
        return 0.0

    slope = sum((i - mean_x) * (y - mean_y) for i, y in enumerate(values)) / denominator
    # Normalise to a proportion of mean sales per quarter.
    return max(-2.0, min(slope / mean_y, 2.0))


def sales_volatility(recent_gross_sales: Sequence[float]) -> float:
    """Population standard deviation of quarter-on-quarter growth rates.

    An enterprise whose sales swing violently is harder to sustain than one
    with the same average performance and steady output, and the mandated
    features cannot express that distinction.
    """
    values = [float(v) for v in recent_gross_sales]
    if len(values) < 3:
        return 0.0

    growth_rates = [
        (values[i] - values[i - 1]) / values[i - 1]
        for i in range(1, len(values))
        if values[i - 1] > 0
    ]
    if len(growth_rates) < 2:
        return 0.0
    return min(pstdev(growth_rates), 3.0)


def sales_vs_baseline_ratio(
    gross_sales: float,
    baseline_semestral_gross_sales: float | None,
) -> float:
    """Current quarterly Gross Sales against the Form 008 baseline.

    Form 008 records Total Gross Sales on a **semester** basis (the semester
    closest to project approval), so the baseline is halved to put it on a
    comparable quarterly footing. This is the same unit mismatch that section
    2.3.2.3.2 avoids by excluding the baseline from Equation 5; here the
    conversion is explicit rather than implied.

    Returns 1.0 (parity with baseline) when no baseline is recorded.
    """
    if not baseline_semestral_gross_sales or baseline_semestral_gross_sales <= 0:
        return 1.0
    quarterly_baseline = baseline_semestral_gross_sales / 2.0
    return min(gross_sales / quarterly_baseline, 10.0)


# --- Employment quality ----------------------------------------------------


def regular_employment_ratio(regular_count: int, total_employees: int) -> float:
    """Share of employees on Regular status.

    Source: ``employees.status``. Equation 6 counts heads; it cannot see that
    an enterprise has replaced regular staff with part-time or project-based
    workers while holding headcount flat. That substitution is a precarity
    signal.
    """
    if total_employees <= 0:
        return 0.0
    return regular_count / total_employees


def avg_workdays_per_employee(total_workdays: float, total_employees: int) -> float:
    """Mean days worked per employee in the quarter.

    Man-Months (Equation 8) is a total, so it falls both when staff leave and
    when retained staff work fewer days. This isolates the second: stable
    headcount on sharply reduced days is underemployment, and it typically
    precedes redundancies.
    """
    if total_employees <= 0:
        return 0.0
    return total_workdays / total_employees


# --- Market position, support, compliance ---------------------------------


def market_count(active_markets: int) -> int:
    """Number of market outlets recorded for the quarter (``markets`` rows).

    Concentration risk: an enterprise selling to one buyer is materially more
    fragile than one selling to six, at identical sales.
    """
    return int(active_markets)


def interventions_availed_count(availed: int) -> int:
    """DOST interventions availed during the quarter.

    Source: ``interventions`` rows where ``availed`` is true. Represents
    support received, letting the model distinguish enterprises already under
    active assistance.
    """
    return int(availed)


def report_days_late(days_late: int | None) -> float:
    """Days between the monitoring report's due date and its submission.

    Source: ``quarterly_metrics.submitted_at`` against the reporting deadline.

    In government monitoring programmes this behavioural indicator is often
    among the strongest available: an enterprise in difficulty tends to stop
    submitting on time before its financial indicators fully deteriorate.
    Negative values (early submission) are floored at zero.
    """
    if days_late is None:
        return 0.0
    return float(max(0, days_late))


def problems_reported_count(problems: int) -> int:
    """Problems recorded on the quarterly narrative.

    Source: ``narratives`` rows where ``type = 'PROBLEMS'``. Section 2.3.2.3
    excludes narrative *content* from the mandated vector; this uses only the
    count, keeping the free text as SSCP Focal context exactly as the paper
    intends.
    """
    return int(problems)


# --- Assembly --------------------------------------------------------------


@dataclass
class ExtendedInputs:
    """Raw quarterly aggregates required to build the extended vector.

    Field names deliberately track the DPRMS tables they come from, so the
    Laravel mirror of this module is a direct transcription.
    """

    gross_sales: float
    total_production_cost: float
    labor_cost: float
    material_cost: float

    repayment_days_late_values: Sequence[int]
    repayment_overdue_entries: int
    repayment_amount_paid: float
    repayment_amount_due_to_date: float

    recent_gross_sales: Sequence[float]
    baseline_semestral_gross_sales: float | None

    regular_employee_count: int
    total_employee_count: int
    total_workdays: float

    active_markets: int
    interventions_availed: int
    report_days_late_value: int | None
    problems_reported: int


def build_extended_vector(inputs: ExtendedInputs) -> list[float]:
    """Assemble the extended vector in ``EXTENDED_FEATURE_NAMES`` order."""
    return [
        cost_to_sales_ratio(inputs.total_production_cost, inputs.gross_sales),
        gross_margin(inputs.total_production_cost, inputs.gross_sales),
        labor_cost_share(inputs.labor_cost, inputs.total_production_cost),
        material_cost_ratio(inputs.material_cost, inputs.gross_sales),
        repayment_days_late(inputs.repayment_days_late_values),
        float(repayment_overdue_count(inputs.repayment_overdue_entries)),
        repayment_completion_ratio(
            inputs.repayment_amount_paid, inputs.repayment_amount_due_to_date
        ),
        sales_trend_3q(inputs.recent_gross_sales),
        sales_volatility(inputs.recent_gross_sales),
        sales_vs_baseline_ratio(
            inputs.gross_sales, inputs.baseline_semestral_gross_sales
        ),
        regular_employment_ratio(
            inputs.regular_employee_count, inputs.total_employee_count
        ),
        avg_workdays_per_employee(inputs.total_workdays, inputs.total_employee_count),
        float(market_count(inputs.active_markets)),
        float(interventions_availed_count(inputs.interventions_availed)),
        report_days_late(inputs.report_days_late_value),
        float(problems_reported_count(inputs.problems_reported)),
    ]


def as_named_dict(vector: Sequence[float], names: Sequence[str]) -> dict[str, float]:
    """Pair an ordered vector with its feature names for logging and display."""
    if len(vector) != len(names):
        raise ValueError(f"expected {len(names)} features, received {len(vector)}")
    return dict(zip(names, (float(v) for v in vector)))


__all__ = [
    "ALL_FEATURE_NAMES",
    "EXTENDED_FEATURE_NAMES",
    "FEATURE_LABELS",
    "ExtendedInputs",
    "WORKING_DAYS_PER_MAN_MONTH",
    "as_named_dict",
    "build_extended_vector",
]
