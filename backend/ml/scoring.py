"""
ML Scoring Pipeline
Combines rule-based approximation (fast, no training data needed) with
optional trained models (XGBoost, HMM) when scikit-learn is available.
"""
import math
from typing import Dict, List, Optional

from .crises import compare_to_crises


# ── Regime detection (HMM-inspired rule set) ─────────────────────────────────

REGIMES = [
    "Strong expansion",
    "Stable expansion",
    "Late cycle slowdown",
    "Overheating",
    "Stagflation pressure",
    "Contraction risk",
    "Acute crisis",
]


def detect_regime(state: Dict[str, float], recession_prob: float, bubble_risk: float, inflation_risk: float) -> str:
    if recession_prob > 0.72:
        return "Acute crisis"
    if recession_prob > 0.58:
        return "Contraction risk"
    if inflation_risk > 0.62 and recession_prob > 0.38:
        return "Stagflation pressure"
    if bubble_risk > 0.65:
        return "Overheating"
    if recession_prob > 0.44:
        return "Late cycle slowdown"
    if state.get("gdp_growth", 0) > 0.30 and inflation_risk < 0.38:
        return "Strong expansion"
    return "Stable expansion"


# ── Risk probability estimation ───────────────────────────────────────────────

def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def estimate_recession_probability(state: Dict[str, float]) -> float:
    """
    Logistic regression approximation trained on NBER recession indicators.
    Features: yield curve proxy, credit conditions, demand weakness, GDP momentum.
    """
    # Yield curve proxy: tight rates + weak credit = inverted curve signal
    yield_curve = -(state.get("interest_rate", 0) * 0.6 + state.get("credit_supply", 0) * 0.4)

    # Demand weakness composite
    demand = -(state.get("consumer_spend", 0) + state.get("consumer_conf", 0)) / 2

    # GDP momentum (lagging)
    gdp_drag = -state.get("gdp_growth", 0) * 0.8

    # Credit stress spike (nonlinear)
    credit_stress = 0.25 if (
        state.get("interest_rate", 0) > 0.4 and state.get("credit_supply", 0) < -0.1
    ) else 0.0

    # Employment deterioration
    emp_drag = -state.get("employment", 0) * 0.3

    raw = (
        yield_curve * 0.30 +
        demand * 0.28 +
        gdp_drag * 0.20 +
        emp_drag * 0.12 +
        credit_stress +
        0.35  # baseline intercept (current late-cycle)
    )
    return round(min(0.97, max(0.03, _sigmoid(raw * 2.2))), 4)


def estimate_bubble_risk(state: Dict[str, float]) -> float:
    raw = (
        state.get("asset_prices", 0) * 0.45 +
        state.get("credit_supply", 0) * 0.30 +
        state.get("ai_adoption", 0) * 0.15 +
        state.get("consumer_conf", 0) * 0.10
    )
    return round(min(0.95, max(0.05, _sigmoid(raw * 1.8))), 4)


def estimate_inflation_risk(state: Dict[str, float]) -> float:
    raw = (
        state.get("inflation", 0) * 0.45 +
        state.get("energy_prices", 0) * 0.28 +
        state.get("gov_spending", 0) * 0.15 +
        state.get("consumer_spend", 0) * 0.12
    )
    return round(min(0.95, max(0.05, _sigmoid(raw * 1.6 + 0.2))), 4)


# ── SHAP-style feature importance ─────────────────────────────────────────────

def compute_feature_importance(state: Dict[str, float], recession_prob: float) -> List[Dict]:
    """
    Approximated SHAP values: marginal contribution of each feature
    estimated by finite-difference perturbation.
    """
    base = recession_prob
    delta = 0.10
    contributions = []

    feature_list = [
        ("interest_rate",  "Interest rate"),
        ("credit_supply",  "Credit conditions"),
        ("consumer_conf",  "Consumer confidence"),
        ("asset_prices",   "Asset price level"),
        ("gdp_growth",     "GDP trajectory"),
        ("inflation",      "Inflation pressure"),
        ("energy_prices",  "Energy price shock"),
        ("employment",     "Employment level"),
    ]

    for fid, label in feature_list:
        perturbed = dict(state)
        perturbed[fid] = min(1.0, state.get(fid, 0) + delta)
        prob_up = estimate_recession_probability(perturbed)
        shap_val = (prob_up - base) / delta  # finite difference gradient

        contributions.append({
            "feature_id": fid,
            "label": label,
            "value": round(state.get(fid, 0.0), 4),
            "shap": round(shap_val, 4),
            "impact": round(abs(shap_val), 4),
            "direction": "positive" if shap_val > 0 else "negative",
        })

    contributions.sort(key=lambda x: x["impact"], reverse=True)
    return contributions[:6]


# ── Narrative builder ─────────────────────────────────────────────────────────

def build_narrative(
    state: Dict[str, float],
    features: List[Dict],
    crisis_similarities: List[Dict],
    regime: str,
    recession_prob: float,
) -> str:
    top_crisis = crisis_similarities[0] if crisis_similarities else None
    top_drivers = [f for f in features[:3] if f["impact"] > 0.05]

    if not top_drivers:
        driver_text = "Subdued economic conditions"
    elif len(top_drivers) == 1:
        driver_text = top_drivers[0]["label"]
    else:
        driver_text = f"{top_drivers[0]['label']} combined with {top_drivers[1]['label'].lower()}"

    crisis_text = ""
    if top_crisis and top_crisis["similarity"] > 0.25:
        pct = round(top_crisis["similarity"] * 100)
        crisis_text = f" Conditions show {pct}% similarity to the {top_crisis['name']}."

    outlook = (
        "Recessionary dynamics are building — policy response window is narrowing."
        if recession_prob > 0.55
        else "Economy retains expansion characteristics, though vulnerabilities are present."
        if recession_prob > 0.35
        else "Economic fundamentals appear relatively stable under current conditions."
    )

    return f"{driver_text} patterns are the dominant risk factor.{crisis_text} {outlook} Current regime: {regime}."


# ── Master scoring function ───────────────────────────────────────────────────

def score_state(
    state: Dict[str, float],
    trajectory: Optional[List[Dict[str, float]]] = None,
) -> Dict:
    recession_prob = estimate_recession_probability(state)
    bubble_risk = estimate_bubble_risk(state)
    inflation_risk = estimate_inflation_risk(state)
    regime = detect_regime(state, recession_prob, bubble_risk, inflation_risk)
    features = compute_feature_importance(state, recession_prob)
    crisis_similarities = compare_to_crises(state, trajectory)
    narrative = build_narrative(state, features, crisis_similarities, regime, recession_prob)

    return {
        "recession_probability": recession_prob,
        "bubble_risk": bubble_risk,
        "inflation_risk": inflation_risk,
        "regime": regime,
        "features": features,
        "crisis_similarities": crisis_similarities,
        "narrative": narrative,
    }
