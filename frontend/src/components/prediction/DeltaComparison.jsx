import { C } from "../../styles/tokens.js";
import { NODE_FULL_LABELS } from "../../engine/simulation.js";

const SHOW_NODES = ["gdp_growth","inflation","employment","asset_prices","consumer_conf","consumer_spend","credit_supply","interest_rate"];

export default function DeltaComparison({ baseline, finalState }) {
  if (!baseline || !finalState) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
      {SHOW_NODES.map(id => {
        const base = baseline[id] ?? 0;
        const sim  = finalState[id] ?? 0;
        const diff = sim - base;
        const col  = diff > 0.02 ? C.green : diff < -0.02 ? C.red : C.textMut;

        return (
          <div key={id} style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            padding: "8px 10px",
          }}>
            <div style={{ fontSize: 9, color: C.textMut, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: C.mono }}>
              {NODE_FULL_LABELS[id]}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                {Math.round(sim * 100)}
              </span>
              <span style={{ fontFamily: C.mono, fontSize: 10, color: col }}>
                {diff >= 0 ? "+" : ""}{Math.round(diff * 100)}
              </span>
            </div>
            {/* Mini bar */}
            <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginTop: 5, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${((sim + 1) / 2) * 100}%`,
                background: col,
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
