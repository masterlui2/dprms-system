"""Rule-derived outcome labelling for SETUP monitoring observations.

Paper section 2.3.2.4 encodes historical outcomes as::

    Routine Monitoring            -> Y = 0 -> deployed class "No Risk Flag"
    Additional Review or Follow-up -> Y = 1 -> deployed class "At Risk"

and states that where no standardised binary outcome exists, "the label is
derived from verified subsequent project records or authorized personnel
confirmation rather than directly from changes in the predictor values."

This module implements the first of those two paths. An observation made at
quarter *t* is labelled from what the **subsequent** quarter *t+1* actually
recorded. The classifier therefore never sees the evidence its label was
built from: it reads quarter *t* and must anticipate quarter *t+1*. That is
what makes the task predictive rather than a restatement of the input, and it
is the same prediction-time boundary described in section 2.3.2.2.

Two properties matter for defending this in the paper:

1. **The rule is documented and reproducible.** Every threshold below is a
   named constant with a stated rationale, so a reviewer can audit why a
   given historical quarter was treated as a follow-up case.
2. **The rule is replaceable.** Once DOST Davao Oriental supplies verified
   follow-up records, or once SSCP Focals have confirmed enough outcomes
   inside DPRMS, ``label_from_subsequent_quarter`` is swapped for those
   confirmed labels without touching feature computation or training.

The thresholds encode ordinary SETUP deterioration patterns. They are not
DOST-issued intervention thresholds, and the paper should say so explicitly
(consistent with the Table 5 caveat about illustrative values).
"""

from __future__ import annotations

from dataclasses import dataclass, field

# --- Compound conditions -------------------------------------------------
# Any two of these co-occurring in quarter t+1 mark the observation at t as a
# case that warranted additional review.

#: Quarter-on-quarter Gross Sales fell by at least this much (percent).
SALES_CONTRACTION_PCT = -10.0

#: Employment fell below the Pre-Implementation (Form 008) level at all.
EMPLOYMENT_BELOW_BASELINE_PCT = 0.0

#: Man-Months retained relative to the prior quarter; below this is a
#: material contraction in recorded labour activity.
LABOR_RETENTION_RATIO = 0.85

# --- Severe conditions ---------------------------------------------------
# Any one of these alone is sufficient, because a single quarter of this
# magnitude is what personnel already treat as requiring follow-up.

#: A collapse in quarterly sales.
SEVERE_SALES_CONTRACTION_PCT = -25.0

#: Employment this far below the Pre-Implementation baseline.
SEVERE_EMPLOYMENT_SHORTFALL_PCT = -20.0

#: Number of compound conditions that together trigger the flag.
COMPOUND_CONDITIONS_REQUIRED = 2

ROUTINE_MONITORING = 0
ADDITIONAL_REVIEW_OR_FOLLOW_UP = 1

CLASS_NAMES = {
    ROUTINE_MONITORING: "No Risk Flag",
    ADDITIONAL_REVIEW_OR_FOLLOW_UP: "At Risk",
}

OUTCOME_NAMES = {
    ROUTINE_MONITORING: "Routine Monitoring",
    ADDITIONAL_REVIEW_OR_FOLLOW_UP: "Additional Review or Follow-up",
}


@dataclass
class LabelDecision:
    """The label plus the reasoning that produced it.

    Retaining ``triggered`` makes every training label auditable after the
    fact, which is what lets the dataset be defended rather than merely
    asserted.
    """

    label: int
    triggered: list[str] = field(default_factory=list)
    severe: bool = False

    @property
    def outcome_name(self) -> str:
        return OUTCOME_NAMES[self.label]

    @property
    def class_name(self) -> str:
        return CLASS_NAMES[self.label]


def label_from_subsequent_quarter(
    *,
    productivity_increase_next: float,
    employment_increase_next: float,
    man_months_next: float,
    man_months_current: float,
    productivity_increase_current: float,
) -> LabelDecision:
    """Derive the outcome label for an observation at quarter *t*.

    All ``*_next`` arguments describe quarter *t+1*, the verified subsequent
    monitoring record. ``productivity_increase_current`` is quarter *t*'s own
    value and participates only in the sustained-decline condition, which by
    definition spans both quarters.

    Returns a :class:`LabelDecision` carrying the label and the named
    conditions that fired.
    """
    triggered: list[str] = []

    # Severe conditions: each is independently sufficient.
    severe = False
    if productivity_increase_next <= SEVERE_SALES_CONTRACTION_PCT:
        triggered.append("SEVERE_SALES_CONTRACTION")
        severe = True
    if employment_increase_next <= SEVERE_EMPLOYMENT_SHORTFALL_PCT:
        triggered.append("SEVERE_EMPLOYMENT_SHORTFALL")
        severe = True

    # Compound conditions: two or more together are sufficient.
    compound: list[str] = []
    if productivity_increase_next <= SALES_CONTRACTION_PCT:
        compound.append("SALES_CONTRACTION")
    if employment_increase_next < EMPLOYMENT_BELOW_BASELINE_PCT:
        compound.append("EMPLOYMENT_BELOW_BASELINE")
    if productivity_increase_current < 0 and productivity_increase_next < 0:
        compound.append("SUSTAINED_DECLINE")
    if man_months_current > 0 and man_months_next <= man_months_current * LABOR_RETENTION_RATIO:
        compound.append("LABOR_CONTRACTION")

    triggered.extend(compound)

    if severe or len(compound) >= COMPOUND_CONDITIONS_REQUIRED:
        return LabelDecision(
            label=ADDITIONAL_REVIEW_OR_FOLLOW_UP,
            triggered=triggered,
            severe=severe,
        )
    return LabelDecision(label=ROUTINE_MONITORING, triggered=triggered, severe=False)


def describe_rule() -> str:
    """Prose description of the rule, for inclusion in the paper and reports."""
    return (
        "An observation at quarter t is labelled Additional Review or Follow-up "
        "when the verified subsequent quarter (t+1) records either a severe "
        f"single deterioration -- a quarter-on-quarter Gross Sales decline of "
        f"{abs(SEVERE_SALES_CONTRACTION_PCT):.0f}% or more, or employment "
        f"{abs(SEVERE_EMPLOYMENT_SHORTFALL_PCT):.0f}% or more below the "
        "Pre-Implementation baseline -- or at least "
        f"{COMPOUND_CONDITIONS_REQUIRED} of the following co-occurring "
        f"conditions: a Gross Sales decline of {abs(SALES_CONTRACTION_PCT):.0f}% "
        "or more; employment below the Pre-Implementation baseline; a second "
        "consecutive quarter of declining Gross Sales; or a fall in Man-Months "
        f"to {LABOR_RETENTION_RATIO:.0%} or less of the preceding quarter. "
        "All other observations are labelled Routine Monitoring. The classifier "
        "reads only quarter t and therefore anticipates, rather than restates, "
        "these subsequent conditions."
    )
