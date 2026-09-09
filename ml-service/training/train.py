"""Train and evaluate the SETUP intervention-risk classifier.

Implements stages 4-6 of the machine-learning lifecycle (model selection,
training, evaluation) for the capstone's predictive component.

What this script produces, and why each piece exists:

* **Model comparison** -- Random Forest against regularised logistic
  regression, a single decision tree, and two trivial baselines. Paper section
  2.3.2 commits to Random Forest, so that choice needs *evidence* rather than
  assertion. A reviewer asking "why an ensemble for five features?" gets a
  table instead of an argument.

* **The persistence baseline** -- the control that matters most here. Because
  training labels are rule-derived from quarter *t+1*, the obvious challenge is
  that the model merely re-learns the labelling rule. The persistence baseline
  applies that same rule to quarter *t*'s own values, i.e. it assumes next
  quarter resembles this one. If the Random Forest cannot beat it, the model
  adds nothing over a spreadsheet filter, and that must surface here rather
  than at defence.

* **Probability calibration** -- Random Forest probabilities are vote
  proportions, biased toward the middle of the range. Table 9 of the paper
  displays an At Risk *probability* to a human reviewer, and the capacity
  analysis below selects a threshold from it, so the number has to mean what
  it says. Isotonic calibration is fitted inside the cross-validation folds.

* **Capacity-aware thresholds** -- converts a probability into an operational
  decision. DOST Davao Oriental can review a limited number of projects per
  quarter; this reports what each review budget actually buys.

* **Core vs extended feature sets** -- the paper's mandated five are evaluated
  on their own, then alongside the extended set, so the mandated model stands
  independently and the enhancement is quantified.

Every metric here is computed on synthetic data and validates the *pipeline*,
not real-world predictive accuracy (paper section 2.3.2.4).

Run:  python -m training.train
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

from app.features import FEATURE_NAMES as CORE_FEATURES
from app.features_extended import EXTENDED_FEATURE_NAMES
from training import labeling

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "observations.csv"
ARTIFACT_DIR = ROOT / "artifacts"

RANDOM_STATE = 20260909
N_SPLITS = 5

ALL_FEATURES = list(CORE_FEATURES) + list(EXTENDED_FEATURE_NAMES)


# --- Metrics ---------------------------------------------------------------


@dataclass
class Result:
    """Out-of-fold performance for one model on one feature set."""

    name: str
    feature_set: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float | None
    brier: float | None
    confusion: list[list[int]]
    fold_recall: list[float] = field(default_factory=list)
    fold_f1: list[float] = field(default_factory=list)

    @property
    def recall_sd(self) -> float:
        return float(np.std(self.fold_recall)) if self.fold_recall else 0.0

    def as_dict(self) -> dict:
        return {
            "model": self.name,
            "feature_set": self.feature_set,
            "accuracy": round(self.accuracy, 4),
            "precision": round(self.precision, 4),
            "recall": round(self.recall, 4),
            "f1": round(self.f1, 4),
            "roc_auc": round(self.roc_auc, 4) if self.roc_auc is not None else None,
            "brier": round(self.brier, 4) if self.brier is not None else None,
            "recall_sd_across_folds": round(self.recall_sd, 4),
            "confusion_matrix": self.confusion,
        }


def _score(
    name: str,
    feature_set: str,
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: np.ndarray | None,
    fold_recall: list[float],
    fold_f1: list[float],
) -> Result:
    return Result(
        name=name,
        feature_set=feature_set,
        accuracy=accuracy_score(y_true, y_pred),
        precision=precision_score(y_true, y_pred, zero_division=0),
        recall=recall_score(y_true, y_pred, zero_division=0),
        f1=f1_score(y_true, y_pred, zero_division=0),
        roc_auc=roc_auc_score(y_true, y_prob) if y_prob is not None else None,
        brier=brier_score_loss(y_true, y_prob) if y_prob is not None else None,
        confusion=confusion_matrix(y_true, y_pred).tolist(),
        fold_recall=fold_recall,
        fold_f1=fold_f1,
    )


# --- Cross-validated evaluation -------------------------------------------


def evaluate(
    estimator,
    X: pd.DataFrame,
    y: np.ndarray,
    groups: np.ndarray,
    name: str,
    feature_set: str,
) -> tuple[Result, np.ndarray]:
    """Project-grouped cross-validation.

    ``GroupKFold`` on the project code guarantees that no MSME contributes
    observations to both the training and test side of a fold (paper section
    2.3.2.4). A plain random split would leak an enterprise's own trajectory
    across the boundary and inflate every metric reported here.
    """
    cv = GroupKFold(n_splits=N_SPLITS)
    oof_pred = np.zeros(len(y), dtype=int)
    oof_prob = np.zeros(len(y), dtype=float)
    fold_recall: list[float] = []
    fold_f1: list[float] = []

    for train_idx, test_idx in cv.split(X, y, groups):
        model = _clone(estimator)
        model.fit(X.iloc[train_idx], y[train_idx])

        pred = model.predict(X.iloc[test_idx])
        oof_pred[test_idx] = pred
        if hasattr(model, "predict_proba"):
            oof_prob[test_idx] = model.predict_proba(X.iloc[test_idx])[:, 1]

        fold_recall.append(recall_score(y[test_idx], pred, zero_division=0))
        fold_f1.append(f1_score(y[test_idx], pred, zero_division=0))

    has_prob = bool(oof_prob.any())
    result = _score(
        name, feature_set, y, oof_pred, oof_prob if has_prob else None,
        fold_recall, fold_f1,
    )
    return result, oof_prob


def _clone(estimator):
    from sklearn.base import clone

    return clone(estimator)


# --- Baselines -------------------------------------------------------------


def persistence_baseline(df: pd.DataFrame) -> np.ndarray:
    """Predict by assuming quarter *t+1* will resemble quarter *t*.

    The labelling rule is applied to the observation's own recorded values, as
    though this quarter's performance were next quarter's. This is the closest
    thing to what a Focal does today with a spreadsheet: look at the current
    numbers and judge.

    Any advantage the Random Forest holds over this baseline is the value the
    model genuinely adds. If there is none, that is the finding.
    """
    predictions = []
    for _, row in df.iterrows():
        decision = labeling.label_from_subsequent_quarter(
            productivity_increase_next=row["productivity_increase"],
            employment_increase_next=row["employment_increase"],
            # Assuming no change means the labour-contraction condition cannot
            # fire; that is inherent to a persistence assumption.
            man_months_next=row["man_months"],
            man_months_current=row["man_months"],
            productivity_increase_current=row["productivity_increase"],
        )
        predictions.append(decision.label)
    return np.array(predictions, dtype=int)


# --- Operational threshold analysis ---------------------------------------


def capacity_analysis(
    y_true: np.ndarray, y_prob: np.ndarray, quarters: int
) -> list[dict]:
    """What each quarterly review budget actually buys.

    A classifier reports a probability; a provincial office has finite staff.
    This converts one into the other: for a range of review capacities, rank
    projects by At Risk probability, take the top N per quarter, and report how
    many genuine follow-up cases that captures.

    It is the difference between "the model is 78% accurate" and "reviewing ten
    projects a quarter catches roughly two-thirds of the cases that needed
    follow-up" -- only the second is a sentence a Provincial Director can act
    on.
    """
    order = np.argsort(-y_prob)
    total_positive = int(y_true.sum())
    rows: list[dict] = []

    for per_quarter in (5, 10, 15, 20, 30):
        budget = min(per_quarter * quarters, len(y_true))
        selected = order[:budget]
        caught = int(y_true[selected].sum())
        rows.append(
            {
                "reviews_per_quarter": per_quarter,
                "total_reviewed": int(budget),
                "threshold": round(float(y_prob[order[budget - 1]]), 4),
                "true_cases_caught": caught,
                "total_true_cases": total_positive,
                "recall_at_capacity": round(caught / total_positive, 4)
                if total_positive
                else 0.0,
                "precision_at_capacity": round(caught / budget, 4) if budget else 0.0,
                "wasted_reviews": int(budget - caught),
            }
        )
    return rows


def calibration_table(y_true: np.ndarray, y_prob: np.ndarray, bins: int = 5) -> list[dict]:
    """Predicted probability against observed frequency, per bin.

    When the system tells a Focal "82% At Risk", roughly 82 of every 100 such
    projects should genuinely have needed follow-up. This is the evidence for
    that claim -- or against it.
    """
    edges = np.linspace(0.0, 1.0, bins + 1)
    rows: list[dict] = []
    for i in range(bins):
        lo, hi = edges[i], edges[i + 1]
        mask = (y_prob >= lo) & (y_prob < hi if i < bins - 1 else y_prob <= hi)
        if not mask.any():
            continue
        rows.append(
            {
                "bin": f"{lo:.1f}-{hi:.1f}",
                "n": int(mask.sum()),
                "mean_predicted": round(float(y_prob[mask].mean()), 4),
                "observed_rate": round(float(y_true[mask].mean()), 4),
            }
        )
    return rows


# --- Reporting -------------------------------------------------------------


def print_comparison(results: list[Result]) -> None:
    print()
    print("MODEL COMPARISON  (project-grouped 5-fold cross-validation)")
    print("=" * 96)
    print(
        f"{'model':<26}{'features':<10}{'acc':>7}{'prec':>8}{'recall':>8}"
        f"{'F1':>8}{'AUC':>8}{'Brier':>8}{'recall sd':>11}"
    )
    print("-" * 96)
    for r in results:
        auc = f"{r.roc_auc:.3f}" if r.roc_auc is not None else "   -  "
        brier = f"{r.brier:.3f}" if r.brier is not None else "   -  "
        print(
            f"{r.name:<26}{r.feature_set:<10}{r.accuracy:>7.3f}{r.precision:>8.3f}"
            f"{r.recall:>8.3f}{r.f1:>8.3f}{auc:>8}{brier:>8}{r.recall_sd:>11.3f}"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--out-dir", type=Path, default=ARTIFACT_DIR)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    y = df["label"].to_numpy(dtype=int)
    groups = df["project_code"].to_numpy()
    quarters = int(df.groupby(["year", "quarter"]).ngroups)

    print(f"Observations : {len(df)}")
    print(f"Projects     : {df['project_code'].nunique()}")
    print(f"At Risk      : {y.sum()} ({y.mean():.1%})")
    print(f"Folds        : {N_SPLITS}, grouped by project")

    feature_sets = {
        "core": list(CORE_FEATURES),
        "extended": ALL_FEATURES,
    }

    # Random Forest wrapped in isotonic calibration. class_weight='balanced'
    # because At Risk is the minority class and Recall is the priority
    # (section 2.3.2.6: a false negative is a follow-up case the classifier
    # failed to prioritise).
    def make_rf() -> RandomForestClassifier:
        return RandomForestClassifier(
            n_estimators=400,
            max_depth=None,
            min_samples_leaf=3,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    candidates = {
        "Random Forest": make_rf(),
        "Random Forest (calibrated)": CalibratedClassifierCV(
            make_rf(), method="isotonic", cv=3
        ),
        "Logistic Regression": Pipeline(
            [
                ("scale", StandardScaler()),
                (
                    "clf",
                    LogisticRegression(
                        max_iter=2000,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=5,
            min_samples_leaf=10,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "Majority Class": DummyClassifier(strategy="most_frequent"),
    }

    results: list[Result] = []
    probabilities: dict[tuple[str, str], np.ndarray] = {}

    for set_name, columns in feature_sets.items():
        X = df[columns]
        for model_name, estimator in candidates.items():
            result, prob = evaluate(estimator, X, y, groups, model_name, set_name)
            results.append(result)
            probabilities[(model_name, set_name)] = prob

    # The persistence baseline needs no training: it applies the labelling rule
    # to the observation's own values.
    persist_pred = persistence_baseline(df)
    results.append(
        _score("Persistence (rule on t)", "n/a", y, persist_pred, None, [], [])
    )

    results.sort(key=lambda r: (-r.recall, -r.f1))
    print_comparison(results)

    # --- Select the deployed model ---------------------------------------
    # The paper commits to Random Forest, so the calibrated RF on the extended
    # set is the deployment candidate; the comparison above is what justifies
    # that commitment rather than merely restating it.
    deployed_name, deployed_set = "Random Forest (calibrated)", "extended"
    deployed_prob = probabilities[(deployed_name, deployed_set)]
    deployed_result = next(
        r for r in results if r.name == deployed_name and r.feature_set == deployed_set
    )

    print()
    print("CALIBRATION  (does a stated probability mean what it says?)")
    print("=" * 60)
    cal = calibration_table(y, deployed_prob)
    print(f"{'probability bin':<18}{'n':>6}{'predicted':>12}{'observed':>11}")
    print("-" * 60)
    for row in cal:
        print(
            f"{row['bin']:<18}{row['n']:>6}{row['mean_predicted']:>12.3f}"
            f"{row['observed_rate']:>11.3f}"
        )

    print()
    print(f"REVIEW CAPACITY  (over {quarters} monitoring periods)")
    print("=" * 82)
    capacity = capacity_analysis(y, deployed_prob, quarters)
    print(
        f"{'reviews/qtr':<13}{'reviewed':>10}{'threshold':>11}"
        f"{'caught':>9}{'of':>6}{'recall':>9}{'precision':>11}"
    )
    print("-" * 82)
    for row in capacity:
        print(
            f"{row['reviews_per_quarter']:<13}{row['total_reviewed']:>10}"
            f"{row['threshold']:>11.3f}{row['true_cases_caught']:>9}"
            f"{row['total_true_cases']:>6}{row['recall_at_capacity']:>9.3f}"
            f"{row['precision_at_capacity']:>11.3f}"
        )

    # --- Fit the deployed model on all data and persist -------------------
    final_model = CalibratedClassifierCV(make_rf(), method="isotonic", cv=3)
    final_model.fit(df[ALL_FEATURES], y)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    model_path = args.out_dir / "model.joblib"
    joblib.dump(
        {
            "model": final_model,
            "feature_names": ALL_FEATURES,
            "core_feature_names": list(CORE_FEATURES),
            "model_version": f"rf-{datetime.now(timezone.utc):%Y%m%d}-extended",
            "class_names": labeling.CLASS_NAMES,
        },
        model_path,
    )

    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "path": str(args.data),
            "observations": len(df),
            "projects": int(df["project_code"].nunique()),
            "at_risk_rate": round(float(y.mean()), 4),
            "synthetic": True,
        },
        "validation": {
            "scheme": "GroupKFold by project_code",
            "n_splits": N_SPLITS,
        },
        "deployed_model": deployed_result.as_dict(),
        "comparison": [r.as_dict() for r in results],
        "calibration": cal,
        "review_capacity": capacity,
        "labeling_rule": labeling.describe_rule(),
        "limitation": (
            "All metrics are computed on synthetic observations. Per paper "
            "section 2.3.2.4 they validate feature computation, Random Forest "
            "integration, TreeSHAP processing and system output, and must NOT "
            "be reported as real-world predictive performance."
        ),
    }
    (args.out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))

    print()
    print(f"model   -> {model_path}")
    print(f"metrics -> {args.out_dir / 'metrics.json'}")


if __name__ == "__main__":
    main()
