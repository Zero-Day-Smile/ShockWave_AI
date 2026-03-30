import { useState, useEffect, useRef, useCallback } from "react";
import { C } from "./styles/tokens.js";
import { REALITY_STATE, propagate } from "./engine/simulation.js";
import { scoreState } from "./engine/scoring.js";
import Sidebar from "./components/prediction/Sidebar.jsx";
import RealityPanel from "./components/reality/RealityPanel.jsx";
import SimulationPanel from "./components/simulation/SimulationPanel.jsx";

// Try backend; fall back to client engine silently
async function fetchSnapshot() {
  try {
    const r = await fetch("http://localhost:8000/reality/snapshot", { signal: AbortSignal.timeout(2500) });
    if (r.ok) return (await r.json()).state ?? null;
  } catch (_) {}
  return null;
}

async function fetchSimulation(deltas, steps) {
  try {
    const r = await fetch("http://localhost:8000/simulate/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deltas, steps }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      return d.trajectory ?? null;
    }
  } catch (_) {}
  return null;
}

export default function App() {
  const [mode, setMode] = useState("reality");
  const [deltas, setDeltas] = useState({
    interest_rate: 0, gov_spending: 0, energy_prices: 0,
    ai_adoption: 0, consumer_conf: 0, credit_supply: 0,
  });
  const [trajectory, setTrajectory] = useState([]);
  const [animStep, setAnimStep]   = useState(-1);
  const [simRunning, setSimRunning] = useState(false);
  const [backendUp, setBackendUp]  = useState(false);
  const animRef = useRef(null);

  // Scores
  const baselineScores = scoreState(REALITY_STATE);
  const finalState     = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;
  const simScores      = finalState ? scoreState(finalState, trajectory) : null;

  // Check backend on mount
  useEffect(() => {
    fetchSnapshot().then(s => { if (s) setBackendUp(true); });
  }, []);

  const handleLeverChange = useCallback((id, val) => {
    setDeltas(d => ({ ...d, [id]: val }));
  }, []);

  const runSimulation = useCallback(async () => {
    clearTimeout(animRef.current);
    setSimRunning(true);
    setTrajectory([]);
    setAnimStep(-1);

    // Try backend first, fall back to client engine
    let traj = await fetchSimulation(deltas, 16);
    if (!traj) {
      traj = propagate(REALITY_STATE, deltas, 16, 0.025);
    }

    setTrajectory(traj);
    let step = 0;
    const tick = () => {
      step++;
      setAnimStep(step);
      if (step < traj.length - 1) {
        animRef.current = setTimeout(tick, 110);
      } else {
        setSimRunning(false);
      }
    };
    animRef.current = setTimeout(tick, 110);
  }, [deltas]);

  const resetSim = useCallback(() => {
    clearTimeout(animRef.current);
    setTrajectory([]);
    setAnimStep(-1);
    setSimRunning(false);
    setDeltas({ interest_rate: 0, gov_spending: 0, energy_prices: 0, ai_adoption: 0, consumer_conf: 0, credit_supply: 0 });
  }, []);

  useEffect(() => () => clearTimeout(animRef.current), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: C.mono, fontSize: 15, fontWeight: 600, color: C.gold, letterSpacing: "-0.02em" }}>
            ⚡ SHOCKWAVE AI
          </span>
          <span style={{ fontSize: 10, color: C.textMut, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Economic Simulation System
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Backend status */}
          <span style={{ fontSize: 9, color: backendUp ? C.green : C.textMut, fontFamily: C.mono }}>
            {backendUp ? "● backend live" : "○ client mode"}
          </span>

          {/* Mode switch */}
          <div style={{
            display: "flex", gap: 3,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8, padding: 3,
          }}>
            {["reality", "simulation"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11, fontFamily: C.mono, letterSpacing: "0.04em", fontWeight: mode === m ? 600 : 400,
                background: mode === m ? "rgba(232,201,122,0.14)" : "transparent",
                color: mode === m ? C.gold : C.textMut,
                textTransform: "uppercase", transition: "all 0.18s",
              }}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "grid", gridTemplateColumns: "268px 1fr", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        <Sidebar
          scores={baselineScores}
          simScores={simScores}
          mode={mode}
          hasTrajectory={trajectory.length > 0}
        />

        {/* Main */}
        <div style={{ overflowY: "auto", padding: "20px 22px" }}>
          {mode === "reality" && (
            <RealityPanel scores={baselineScores} />
          )}
          {mode === "simulation" && (
            <SimulationPanel
              deltas={deltas}
              onLeverChange={handleLeverChange}
              trajectory={trajectory}
              animStep={animStep}
              simRunning={simRunning}
              onRun={runSimulation}
              onReset={resetSim}
            />
          )}
        </div>
      </div>
    </div>
  );
}
