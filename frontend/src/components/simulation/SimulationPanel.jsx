import { C } from "../../styles/tokens.js";
import { SectionLabel, Card } from "../shared/Card.jsx";
import PolicyPanel from "./PolicyPanel.jsx";
import CausalGraph from "./CausalGraph.jsx";
import TimelineChart from "./TimelineChart.jsx";
import DeltaComparison from "../prediction/DeltaComparison.jsx";
import { REALITY_STATE } from "../../engine/simulation.js";

export default function SimulationPanel({
  deltas, onLeverChange,
  trajectory, animStep, simRunning,
  onRun, onReset,
}) {
  const finalState = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;
  const graphState = finalState ?? REALITY_STATE;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>

      {/* Left: Policy levers */}
      <div>
        <SectionLabel>Policy levers</SectionLabel>
        <PolicyPanel deltas={deltas} onChange={onLeverChange} />

        <button
          onClick={onRun}
          disabled={simRunning}
          style={{
            width: "100%", padding: "10px 0",
            border: `1px solid rgba(232,201,122,${simRunning ? 0.2 : 0.45})`,
            background: simRunning ? "rgba(232,201,122,0.04)" : "rgba(232,201,122,0.09)",
            color: simRunning ? C.textMut : C.gold,
            borderRadius: 8, cursor: simRunning ? "not-allowed" : "pointer",
            fontSize: 12, fontFamily: C.mono, fontWeight: 600, letterSpacing: "0.06em",
            marginBottom: 8, transition: "all 0.2s",
          }}>
          {simRunning ? "◌  PROPAGATING..." : "▶  RUN SIMULATION"}
        </button>

        <button
          onClick={onReset}
          style={{
            width: "100%", padding: "7px 0",
            border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMut,
            borderRadius: 8, cursor: "pointer",
            fontSize: 11, fontFamily: C.mono, letterSpacing: "0.04em",
          }}>
          RESET TO REALITY
        </button>
      </div>

      {/* Right: Visualizations */}
      <div>
        <SectionLabel extra={simRunning ? "LIVE ●" : null}>
          Butterfly propagation
        </SectionLabel>
        <Card>
          <CausalGraph state={graphState} trajectory={trajectory} animStep={animStep} />
        </Card>

        <SectionLabel>Economic timeline</SectionLabel>
        <Card>
          <TimelineChart trajectory={trajectory} />
        </Card>

        {finalState && (
          <>
            <SectionLabel>Final state vs baseline</SectionLabel>
            <DeltaComparison baseline={REALITY_STATE} finalState={finalState} />
          </>
        )}
      </div>
    </div>
  );
}
