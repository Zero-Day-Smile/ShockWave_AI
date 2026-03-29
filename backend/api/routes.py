"""
API Route Handlers
"""
import uuid
import json
import asyncio
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel, Field

from config import get_settings, Settings
from data import get_current_snapshot, get_historical_series
from simulation import propagate, get_graph_metadata, compute_shock_magnitude
from ml import score_state, CRISES_LIBRARY

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class SimulateRequest(BaseModel):
    deltas: Dict[str, float] = Field(default_factory=dict)
    steps: int = Field(default=16, ge=4, le=48)
    noise: float = Field(default=0.025, ge=0.0, le=0.2)
    seed: Optional[int] = None


class ScoreRequest(BaseModel):
    state: Dict[str, float]
    trajectory: Optional[List[Dict[str, float]]] = None


class ExplainRequest(BaseModel):
    state: Dict[str, float]
    baseline_state: Optional[Dict[str, float]] = None
    trajectory: Optional[List[Dict[str, float]]] = None


# ── Reality endpoints ─────────────────────────────────────────────────────────

@router.get("/reality/snapshot")
async def reality_snapshot(settings: Settings = Depends(get_settings)):
    """Current economic state with ML risk scores."""
    state = get_current_snapshot(settings.fred_api_key)
    scores = score_state(state)
    return {
        "state": state,
        "scores": scores,
        "source": "FRED" if settings.fred_api_key != "demo" else "synthetic",
    }


@router.get("/reality/history")
async def reality_history(
    indicator: str = "gdp_growth",
    years: int = 20,
    settings: Settings = Depends(get_settings),
):
    """Historical time series for a given indicator."""
    series = get_historical_series(indicator, years, settings.fred_api_key)
    return {"indicator": indicator, "years": years, "series": series}


# ── Simulation endpoints ──────────────────────────────────────────────────────

@router.post("/simulate/run")
async def simulate_run(req: SimulateRequest, settings: Settings = Depends(get_settings)):
    """Run butterfly propagation and return full trajectory."""
    baseline = get_current_snapshot(settings.fred_api_key)
    steps = min(req.steps, settings.sim_steps * 2)

    trajectory = propagate(
        initial_state=baseline,
        deltas=req.deltas,
        steps=steps,
        noise=req.noise,
        seed=req.seed,
    )

    final_state = trajectory[-1]
    baseline_scores = score_state(baseline)
    final_scores = score_state(final_state, trajectory)
    shock_magnitudes = compute_shock_magnitude(baseline, trajectory)

    return {
        "simulation_id": str(uuid.uuid4()),
        "steps": steps,
        "baseline_state": baseline,
        "trajectory": trajectory,
        "final_state": final_state,
        "shock_magnitudes": shock_magnitudes,
        "baseline_scores": baseline_scores,
        "final_scores": final_scores,
        "delta_recession_prob": round(
            final_scores["recession_probability"] - baseline_scores["recession_probability"], 4
        ),
    }


@router.get("/simulate/graph")
async def simulate_graph():
    """Return causal graph structure for frontend visualization."""
    return get_graph_metadata()


# ── Prediction endpoints ──────────────────────────────────────────────────────

@router.post("/predict/score")
async def predict_score(req: ScoreRequest):
    """Score an arbitrary economic state vector."""
    scores = score_state(req.state, req.trajectory)
    return scores


@router.post("/predict/explain")
async def predict_explain(req: ExplainRequest):
    """Full SHAP explanation with before/after comparison."""
    scores = score_state(req.state, req.trajectory)

    result = {"scores": scores}

    if req.baseline_state:
        baseline_scores = score_state(req.baseline_state)
        result["comparison"] = {
            "recession_prob_delta": round(
                scores["recession_probability"] - baseline_scores["recession_probability"], 4
            ),
            "bubble_risk_delta": round(
                scores["bubble_risk"] - baseline_scores["bubble_risk"], 4
            ),
            "inflation_risk_delta": round(
                scores["inflation_risk"] - baseline_scores["inflation_risk"], 4
            ),
            "regime_changed": scores["regime"] != baseline_scores["regime"],
            "baseline_regime": baseline_scores["regime"],
        }

    return result


# ── Crisis library ────────────────────────────────────────────────────────────

@router.get("/crises/library")
async def crises_library():
    """Return all historical crisis records."""
    return {"crises": CRISES_LIBRARY}


# ── WebSocket streaming ───────────────────────────────────────────────────────

@router.websocket("/simulate/stream")
async def simulate_stream(websocket: WebSocket, settings: Settings = Depends(get_settings)):
    """
    Stream simulation step-by-step over WebSocket.
    Client sends: { deltas: {...}, steps: N }
    Server sends: { step: N, state: {...}, scores?: {...} }
    """
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        req = json.loads(data)
        deltas = req.get("deltas", {})
        steps = min(int(req.get("steps", 16)), 48)

        baseline = get_current_snapshot(settings.fred_api_key)
        trajectory = propagate(baseline, deltas, steps, settings.sim_noise)

        for i, state in enumerate(trajectory):
            payload: Dict = {"step": i, "total": len(trajectory), "state": state}

            # Send scores only at the final step (expensive)
            if i == len(trajectory) - 1:
                payload["scores"] = score_state(state, trajectory)
                payload["baseline_scores"] = score_state(baseline)

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.10)  # 100ms per step → ~1.6s total

        await websocket.send_text(json.dumps({"done": True}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"error": str(e)}))
        except Exception:
            pass
