import { C } from "../../styles/tokens.js";

export default function SHAPWaterfall({ features }) {
  if (!features || !features.length) return null;
  const maxImpact = Math.max(...features.map(f => f.impact), 0.01);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {features.map(f => {
        const pct = Math.round((f.impact / maxImpact) * 100);
        const positive = f.value > 0;
        const color = f.direction === "positive" ? C.red : C.green; // positive shap = increases recession risk

        return (
          <div key={f.feature_id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: C.textSec, fontFamily: C.mono }}>{f.label}</span>
              <span style={{ fontSize: 10, fontFamily: C.mono, color: positive ? C.green : C.red }}>
                {positive ? "▲" : "▼"} {Math.abs(Math.round(f.value * 100))}
              </span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: 2,
                background: color,
                transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: 9, color: C.textMut, marginTop: 2, fontFamily: C.mono }}>
        bar width = relative impact on recession probability
      </p>
    </div>
  );
}
