"""Canonical SETUP monitoring feature definitions.

This module is the single source of truth for the five Random Forest input
features described in the capstone paper, section 2.3.2.3 (Monitoring
Indicators and Feature Computation).

Feature vector, in the fixed order required by section 2.3.2.3.6:

    X_t = [GS_t, PI_t, EG_t, EI_t, MM_t]

At serving time Laravel computes these values from validated quarterly
monitoring records and posts the finished vector to this service (paper
section 2.3.3.4: "The service receives validated SETUP monitoring features
from Laravel"). The implementations here drive dataset generation and
training, and they are mirrored field-for-field by
``backend/app/Services/AnalyticsModule/SetupRiskFeatureService.php``.
Any change to an equation here must be made there in the same commit.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

# Section 2.3.2.3.5: SETUP Form 008 defines 20 working days as one man-month.
WORKING_DAYS_PER_MAN_MONTH = 20

# Order is contractual. The trained model indexes features positionally, so
# reordering this tuple silently invalidates every persisted model artifact.
FEATURE_NAMES: tuple[str, ...] = (
    "gross_sales",
    "productivity_increase",
    "employment_generated",
    "employment_increase",
    "man_months",
)

# Human-readable labels used in TreeSHAP explanations shown to the SSCP Focal.
FEATURE_LABELS: dict[str, str] = {
    "gross_sales": "Gross Sales",
    "productivity_increase": "Productivity Increase",
    "employment_generated": "Employment Generated",
    "employment_increase": "Employment Increase",
    "man_months": "Man-Months",
}


@dataclass(frozen=True)
class ProductSale:
    """One product line on a quarterly monitoring record."""

    selling_price: float
    quantity: float


def quarterly_gross_sales(products: Iterable[ProductSale]) -> float:
    """Equation 4 — Quarterly Gross Sales.

        GS_t = sum(P_i,t * Q_i,t)

    Worked example (paper Figure 9, record P02): 100 units at PHP 1,200 plus
    60 units at PHP 2,000 gives PHP 240,000.
    """
    return float(sum(p.selling_price * p.quantity for p in products))


def percentage_increase_in_productivity(
    gross_sales_current: float,
    gross_sales_previous: float | None,
) -> float | None:
    """Equation 5 — Percentage Increase in Productivity.

        PI_Qt = ((GS_Qt - GS_Qt-1) / GS_Qt-1) * 100

    Compares two *consecutive quarterly* Gross Sales values. Paper section
    2.3.2.3.2 is explicit that the Pre-Implementation Gross Sales is part of
    the baseline but is NOT used as the preceding quarterly value here.

    Returns ``None`` when no preceding quarter exists (Q1) or when the
    preceding quarter recorded zero sales, since the ratio is undefined.
    That is also why the first complete assessment can only occur after Q2
    (paper section 2.3.2.2).

    Worked example (Figure 10, P02): Q1 PHP 300,000 -> Q2 PHP 240,000
    gives -20.00%.
    """
    if gross_sales_previous is None or gross_sales_previous == 0:
        return None
    return ((gross_sales_current - gross_sales_previous) / gross_sales_previous) * 100.0


def employment_generated(direct_employment: int, indirect_employment: int) -> int:
    """Equation 6 — Employment Generated.

        EG_t = DE_t + IE_t

    SETUP Form 008 defines Total Employment Generated as the combination of
    direct and indirect employment.

    Worked example (Figure 11, P02): 6 direct + 2 indirect = 8.
    """
    return int(direct_employment) + int(indirect_employment)


def percentage_increase_in_employment(
    employment_current: int,
    employment_baseline: int | None,
) -> float | None:
    """Equation 7 — Percentage Increase in Employment Generated.

        EI_t = ((EG_t - EG_0) / EG_0) * 100

    ``employment_baseline`` (EG_0) is the Pre-Implementation employment level
    recorded on SETUP Form 008, NOT the previous quarter. Each MSME keeps its
    own fixed baseline for the life of the project (paper section 2.3.2.2).

    Returns ``None`` when no baseline has been recorded or the baseline is
    zero, which makes the project ineligible for assessment.

    Worked example (Figure 12, P02): baseline 10, current 8 gives -20.00%.
    """
    if employment_baseline is None or employment_baseline == 0:
        return None
    return ((employment_current - employment_baseline) / employment_baseline) * 100.0


def man_months(worker_days: Iterable[float]) -> float:
    """Equation 8 — Man-Months.

        MM_t = sum(WD_j) / 20

    Sums the working days recorded for every worker on the quarterly record
    and converts using the Form 008 relationship of 20 working days per
    man-month.

    Worked example (Figure 13, P02): 160 combined working days = 8 man-months.
    """
    return float(sum(worker_days)) / WORKING_DAYS_PER_MAN_MONTH


def build_feature_vector(
    gross_sales: float,
    productivity_increase: float | None,
    employment_generated_value: int,
    employment_increase: float | None,
    man_months_value: float,
) -> list[float]:
    """Assemble the ordered vector consumed by the Random Forest.

    Section 2.3.2.3.6 presents this as an ordering of already-computed values
    rather than a numbered equation.

    Worked example (Table 7, P02):
        X_Q2 = [240000, -20.00, 8, -20.00, 8]

    Raises ``ValueError`` when a derived feature is undefined. A record that
    cannot produce all five values is not eligible for assessment and must be
    skipped rather than imputed — imputing a productivity or employment change
    would fabricate the very signal the classifier is reading.
    """
    if productivity_increase is None:
        raise ValueError(
            "productivity_increase is undefined: no usable preceding quarter. "
            "The first complete assessment occurs after Q2 (section 2.3.2.2)."
        )
    if employment_increase is None:
        raise ValueError(
            "employment_increase is undefined: no Pre-Implementation employment "
            "baseline (SETUP Form 008) recorded for this project."
        )
    return [
        float(gross_sales),
        float(productivity_increase),
        float(employment_generated_value),
        float(employment_increase),
        float(man_months_value),
    ]


def as_named_dict(vector: Sequence[float]) -> dict[str, float]:
    """Pair an ordered vector with its feature names for logging and display."""
    if len(vector) != len(FEATURE_NAMES):
        raise ValueError(
            f"expected {len(FEATURE_NAMES)} features, received {len(vector)}"
        )
    return dict(zip(FEATURE_NAMES, (float(v) for v in vector)))
