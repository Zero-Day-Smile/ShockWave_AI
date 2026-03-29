"""
Butterfly Effect Simulation Engine
Causal graph with weighted edges, lag, nonlinear dampening, stochastic noise.
"""
import random
import math
from typing import Dict, List, Tuple

# ── Causal graph edge definitions ────────────────────────────────────────────
# (source, target, weight)  weight in [-1, +1]
GRAPH_EDGES: List[Tuple[str, str, float]] = [
    ("interest_rate",  "credit_supply",   -0.72),
    ("interest_rate",  "asset_prices",    -0.55),
    ("interest_rate",  "inflation",       -0.40),
    ("gov_spending",   "gdp_growth",      +0.58),
    ("gov_spending",   "inflation",       +0.32),
    ("gov_spending",   "employment",      +0.44),
    ("energy_prices",  "inflation",       +0.82),
    ("energy_prices",  "consumer_conf",   -0.55),
    ("energy_prices",  "gdp_growth",      -0.38),
    ("ai_adoption",    "employment",      -0.42),
    ("ai_adoption",    "gdp_growth",      +0.28),
    ("ai_adoption",    "asset_prices",    +0.35),
    ("consumer_conf",  "consumer_spend",  +0.74),
    ("consumer_conf",  "asset_prices",    +0.38),
    ("credit_supply",  "asset_prices",    +0.62),
    ("credit_supply",  "gdp_growth",      +0.42),
    ("credit_supply",  "consumer_spend",  +0.35),
    ("inflation",      "consumer_conf",   -0.52),
    ("inflation",      "employment",      -0.28),
    ("inflation",      "asset_prices",    +0.20),
    ("employment",     "consumer_spend",  +0.62),
    ("employment",     "consumer_conf",   +0.50),
    ("asset_prices",   "consumer_conf",   +0.30),
    ("asset_prices",   "credit_supply",   +0.25),
    ("consumer_spend", "gdp_growth",      +0.52),
    ("consumer_spend", "inflation",       +0.22),
    ("gdp_growth",     "employment",      +0.50),
    ("gdp_growth",     "consumer_conf",   +0.40),
]

# Transmission lag factors (0-1, lower = slower response)
LAG_TABLE: Dict[str, float] = {
    "gdp_growth":     0.60,
    "employment":     0.50,
    "inflation":      0.70,
    "asset_prices":   0.90,
    "consumer_conf":  0.85,
    "consumer_spend": 0.80,
    "credit_supply":  0.75,
}

# Policy nodes (user-controlled inputs)
POLICY_NODES = {
    "interest_rate", "gov_spending", "energy_prices",
    "ai_adoption", "consumer_conf", "credit_supply"
}

# All nodes
ALL_NODES = {
    "interest_rate", "gov_spending", "energy_prices", "ai_adoption",
    "consumer_conf", "credit_supply", "inflation", "employment",
    "asset_prices", "consumer_spend", "gdp_growth",
}


def clamp(v: float, lo: float = -1.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def build_adjacency() -> Dict[str, List[Tuple[str, float]]]:
    adj: Dict[str, List] = {n: [] for n in ALL_NODES}
    for src, tgt, w in GRAPH_EDGES:
        adj[src].append((tgt, w))
    return adj


_ADJACENCY = build_adjacency()


def propagate(
    initial_state: Dict[str, float],
    deltas: Dict[str, float],
    steps: int = 16,
    noise: float = 0.025,
    seed: int | None = None,
) -> List[Dict[str, float]]:
    """
    Propagate economic shocks through the causal graph.

    Args:
        initial_state: baseline economic state (all values in [-1, 1])
        deltas: policy lever changes to apply at t=0
        steps: number of time steps to simulate
        noise: stochastic noise amplitude
        seed: random seed for reproducibility

    Returns:
        List of state dicts, one per time step (length = steps + 1)
    """
    if seed is not None:
        random.seed(seed)

    # Ensure all nodes present
    state = {n: initial_state.get(n, 0.0) for n in ALL_NODES}

    # Apply policy shocks at t=0
    for node, delta in deltas.items():
        if node in state:
            state[node] = clamp(state[node] + delta)

    history = [dict(state)]

    for _ in range(steps):
        next_state = dict(state)

        for src, edges in _ADJACENCY.items():
            for tgt, weight in edges:
                influence = weight * state[src]

                # Nonlinear dampening: diminishing returns at extremes
                dampening = 1.0 - abs(state[tgt]) * 0.35
                influence *= dampening

                # Stochastic noise
                influence += (random.random() - 0.5) * 2 * noise

                # Transmission lag
                lag = LAG_TABLE.get(tgt, 1.0)

                next_state[tgt] = clamp(
                    state[tgt] + influence * lag * 0.25
                )

        state = next_state
        history.append(dict(state))

    return history


def compute_shock_magnitude(
    baseline: Dict[str, float],
    trajectory: List[Dict[str, float]],
) -> Dict[str, float]:
    """Return absolute delta between baseline and final simulated state."""
    if not trajectory:
        return {}
    final = trajectory[-1]
    return {
        node: final[node] - baseline.get(node, 0.0)
        for node in ALL_NODES
    }


def get_graph_metadata() -> dict:
    """Return graph structure for frontend visualization."""
    return {
        "nodes": [
            {
                "id": n,
                "policy": n in POLICY_NODES,
                "lag": LAG_TABLE.get(n, 1.0),
            }
            for n in ALL_NODES
        ],
        "edges": [
            {"from": src, "to": tgt, "weight": w}
            for src, tgt, w in GRAPH_EDGES
        ],
    }
