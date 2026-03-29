import { C } from "../../styles/tokens.js";
import { SectionLabel, Card, RegimePill } from "../shared/Card.jsx";
import RiskGauge from "../shared/RiskGauge.jsx";
import SHAPWaterfall from "../shared/SHAPWaterfall.jsx";

function CrisisBar({ crisis, isTop }) {
  const pct = Math.round(crisis.similarity * 100);
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: isTop ? C.gold : C.textSec, fontFamily: C.mono }}>
          {crisis.name}
        </span>
        <span style={{ fontSize: 10, color: isTop ? C.gold : C.textMut, fontFamily: C.mono }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: isTop ? `linear-gradient(90deg, ${C.gold}, #d4a017)` : "rgba(255,255,255,0.2)",
          borderRadius: 2,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>
    </div>
  );
}

export default function Sidebar({ scores, simScores, mode, hasTrajectory }) {
  const display = mode === "simulation" && hasTrajectory ? simScores : scores;
  if (!display) return null;

  const recDiff = hasTrajectory && simScores && scores
    ? Math.round((simScores.recession_probability - scores.recession_probability) * 100)
    : null;

  return (
    <div style={{
      borderRight: `1px solid ${C.border}`,
      padding: "20px 14px",
      overflowY: "auto",
      height: "100%",
    }}>
      {/* Regime */}
      <SectionLabel>Regime</SectionLabel>
      <Card accent={display.recession_probability > 0.55}>
        <RegimePill regime={display.regime} />
        <p style={{ fontSize: 11, color: C.textSec, margin: "10px 0 0", lineHeight: 1.55 }}>
          {display.narrative}
        </p>
      </Card>

      {/* Risk gauges */}
      <SectionLabel>Risk metrics</SectionLabel>
      <Card style={{ display: "flex", justifyContent: "space-around", padding: "14px 6px" }}>
        <RiskGauge label="Recession" value={display.recession_probability} />
        <RiskGauge label="Bubble"    value={display.bubble_risk} />
        <RiskGauge label="Inflation" value={display.inflation_risk} />
      </Card>

      {/* Delta chip */}
      {recDiff !== null && (
        <Card style={{ padding: "10px 14px" }}>
          <SectionLabel>Recession probability shift</SectionLabel>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontFamily: C.mono, fontSize: 22, fontWeight: 600,
              color: recDiff > 0 ? C.red : C.green,
            }}>
              {recDiff > 0 ? "+" : ""}{recDiff}pp
            </span>
            <span style={{ fontSize: 10, color: C.textMut }}>vs reality baseline</span>
          </div>
        </Card>
      )}

      {/* Crisis similarity */}
      <SectionLabel>Historical similarity (DTW)</SectionLabel>
      <Card>
        {(display.crisis_similarities || []).slice(0, 5).map((c, i) => (
          <CrisisBar key={c.id} crisis={c} isTop={i === 0} />
        ))}
      </Card>

      {/* SHAP */}
      <SectionLabel>Key drivers (SHAP)</SectionLabel>
      <Card>
        <SHAPWaterfall features={display.features} />
      </Card>
    </div>
  );
}
