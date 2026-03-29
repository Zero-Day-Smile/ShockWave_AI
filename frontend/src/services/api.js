import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE, timeout: 15000 });

export const getRealitySnapshot = () => api.get("/reality/snapshot").then(r => r.data);
export const getRealityHistory  = (indicator, years = 20) =>
  api.get("/reality/history", { params: { indicator, years } }).then(r => r.data);
export const getSimulateGraph   = () => api.get("/simulate/graph").then(r => r.data);
export const getCrisesLibrary   = () => api.get("/crises/library").then(r => r.data);

export const runSimulation = (deltas, steps = 16) =>
  api.post("/simulate/run", { deltas, steps }).then(r => r.data);

export const predictScore   = (state, trajectory = null) =>
  api.post("/predict/score", { state, trajectory }).then(r => r.data);

export const predictExplain = (state, baseline_state = null, trajectory = null) =>
  api.post("/predict/explain", { state, baseline_state, trajectory }).then(r => r.data);

// WebSocket streaming helper
export function createSimStream(deltas, steps, onStep, onDone, onError) {
  const wsBase = BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/simulate/stream`);

  ws.onopen = () => ws.send(JSON.stringify({ deltas, steps }));
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.done) { onDone(data); ws.close(); }
    else if (data.error) { onError(data.error); ws.close(); }
    else onStep(data);
  };
  ws.onerror = () => onError("WebSocket connection failed");
  ws.onclose = () => {};

  return () => ws.close();
}

export default api;
