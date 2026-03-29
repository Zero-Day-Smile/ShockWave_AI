"""
Historical Crisis Library + DTW Similarity Engine
Compares current/simulated economic state to known historical crises.
"""
import math
from typing import Dict, List

# ── Historical crisis snapshots ───────────────────────────────────────────────
# State vectors normalised to [-1, 1]. Values reflect relative deviation
# from long-run trend at the onset of each crisis.
CRISES_LIBRARY = [
    {
        "id": "2008",
        "name": "2008 Financial Crisis",
        "years": "2007–2009",
        "trigger": "Subprime mortgage collapse, Lehman Brothers failure",
        "outcome": "Global GDP fell 2.1%, US unemployment peaked 10%, S&P -57%",
        "state": {
            "interest_rate":  -0.80,
            "credit_supply":  +0.90,
            "asset_prices":   +0.90,
            "inflation":      +0.20,
            "employment":     +0.30,
            "gdp_growth":     +0.40,
            "consumer_conf":  +0.20,
            "consumer_spend": +0.30,
            "gov_spending":   -0.10,
        },
    },
    {
        "id": "2001",
        "name": "2001 Dot-com Bust",
        "years": "2000–2002",
        "trigger": "Tech equity bubble collapse, 9/11 shock",
        "outcome": "NASDAQ fell 78%, mild recession, unemployment 6.3%",
        "state": {
            "interest_rate":  -0.30,
            "ai_adoption":    +0.80,
            "asset_prices":   +0.95,
            "credit_supply":  +0.40,
            "gdp_growth":     -0.10,
            "consumer_conf":  +0.10,
            "inflation":      +0.15,
        },
    },
    {
        "id": "1970s",
        "name": "1970s Stagflation",
        "years": "1973–1982",
        "trigger": "OPEC oil embargo, loose monetary policy",
        "outcome": "CPI peaked 14.8%, two recessions, unemployment 9%",
        "state": {
            "energy_prices":  +0.95,
            "inflation":      +0.90,
            "consumer_conf":  -0.80,
            "employment":     -0.50,
            "gdp_growth":     -0.40,
            "interest_rate":  +0.60,
            "consumer_spend": -0.40,
        },
    },
    {
        "id": "2020",
        "name": "2020 COVID Shock",
        "years": "2020",
        "trigger": "Global pandemic, supply chain collapse",
        "outcome": "US GDP fell 19.2% in Q2, 22M jobs lost in 2 months",
        "state": {
            "consumer_conf":  -0.90,
            "consumer_spend": -0.80,
            "employment":     -0.70,
            "gov_spending":   +0.90,
            "gdp_growth":     -0.70,
            "credit_supply":  +0.20,
            "asset_prices":   -0.40,
        },
    },
    {
        "id": "1997",
        "name": "1997 Asian Crisis",
        "years": "1997–1998",
        "trigger": "Currency peg failures, contagion to Russia/LTCM",
        "outcome": "GDP contractions across SE Asia, global credit crunch",
        "state": {
            "credit_supply":  +0.70,
            "asset_prices":   +0.60,
            "consumer_conf":  -0.40,
            "inflation":      +0.40,
            "gdp_growth":     +0.20,
            "interest_rate":  -0.20,
        },
    },
    {
        "id": "1987",
        "name": "1987 Black Monday",
        "years": "1987",
        "trigger": "Portfolio insurance cascades, overvalued equities",
        "outcome": "Dow fell 22.6% in one day, swift recovery followed",
        "state": {
            "asset_prices":   +0.85,
            "credit_supply":  +0.50,
            "interest_rate":  +0.40,
            "inflation":      +0.30,
            "consumer_conf":  +0.40,
        },
    },
]


def _euclidean_distance(
    state: Dict[str, float],
    crisis_state: Dict[str, float],
) -> float:
    """Euclidean distance over shared keys."""
    shared = set(state.keys()) & set(crisis_state.keys())
    if not shared:
        return 1.0
    sq_sum = sum((state[k] - crisis_state[k]) ** 2 for k in shared)
    return math.sqrt(sq_sum / len(shared))


def _dtw_distance(
    trajectory: List[Dict[str, float]],
    crisis_state: Dict[str, float],
) -> float:
    """
    Simplified DTW: compare each step of trajectory to the crisis onset state.
    Returns minimum distance found across the trajectory window.
    """
    if not trajectory:
        return 1.0
    distances = [_euclidean_distance(step, crisis_state) for step in trajectory]
    # Weight recent steps more heavily (end-state is what matters)
    weights = [0.5 + 0.5 * (i / len(distances)) for i in range(len(distances))]
    weighted = sum(d * w for d, w in zip(distances, weights)) / sum(weights)
    return weighted


def similarity_score(distance: float, scale: float = 1.2) -> float:
    """Convert distance [0, ∞) → similarity [0, 1] via exponential decay."""
    return math.exp(-distance / scale)


def compare_to_crises(
    state: Dict[str, float],
    trajectory: List[Dict[str, float]] | None = None,
) -> List[Dict]:
    """
    Compare current state (and optionally full trajectory) to all crises.
    Returns list sorted by similarity descending.
    """
    results = []
    for crisis in CRISES_LIBRARY:
        if trajectory and len(trajectory) > 2:
            dist = _dtw_distance(trajectory, crisis["state"])
        else:
            dist = _euclidean_distance(state, crisis["state"])

        sim = similarity_score(dist)
        results.append({
            **crisis,
            "similarity": round(sim, 4),
            "distance": round(dist, 4),
        })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results
