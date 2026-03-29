import { C } from "../../styles/tokens.js";
import { SectionLabel, Card } from "../shared/Card.jsx";
import CausalGraph from "../simulation/CausalGraph.jsx";
import { NODE_FULL_LABELS, REALITY_STATE } from "../../engine/simulation.js";
import { CRISES_LIBRARY } from "../../engine/crises.js";

function IndicatorCard({ id, value, similarity }) {
  const col = value > 0.20 ? C.green : value < -0.20 ? C.red : C.gold;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "10px 12px",
    }}>
      <div style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontFamily: C.mono }}>
        {NODE_FULL_LABELS[id]}
      </div>
      <div style={{ fontSize: 18, fontFamily: C.mono, fontWeight: 600, color: col }}>
        {value > 0 ? "+" : ""}{Math.round(value * 100)}
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, marginTop: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((value + 1) / 2) * 100}%`, background: col, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

export default function RealityPanel({ scores }) {
  const state = REALITY_STATE;

  return (
    <>
      {/* Indicators grid */}
      <SectionLabel>Current economic indicators (normalised · synthetic baseline 2025)</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {Object.keys(NODE_FULL_LABELS).map(id => (
          <IndicatorCard key={id} id={id} value={state[id] ?? 0} />
        ))}
      </div>

      {/* Causal graph */}
      <SectionLabel>Causal dependency graph</SectionLabel>
      <Card>
        <CausalGraph state={state} trajectory={null} animStep={-1} />
        <p style={{ fontSize: 10, color: C.textMut, textAlign: "center", margin: "6px 0 0", fontFamily: C.mono }}>
          node colour = current value · edge colour = positive (green) / negative (red) influence
        </p>
      </Card>

      {/* Crisis library */}
      <SectionLabel>Historical crisis library</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {CRISES_LIBRARY.map(crisis => {
          const sim = scores?.crisis_similarities?.find(s => s.id === crisis.id);
          const pct = Math.round((sim?.similarity ?? 0) * 100);
          const highlight = pct > 30;
          return (
            <div key={crisis.id} style={{
              background: C.surface,
              border: `1px solid ${highlight ? "rgba(232,201,122,0.2)" : C.border}`,
              borderRadius: 8, padding: "12px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.textPrim, marginBottom: 1 }}>{crisis.name}</div>
                  <div style={{ fontSize: 9, color: C.textMut, fontFamily: C.mono }}>{crisis.years}</div>
                </div>
                <span style={{ fontSize: 13, fontFamily: C.mono, fontWeight: 600, color: highlight ? C.gold : C.textMut }}>
                  {pct}%
                </span>
              </div>
              <p style={{ fontSize: 10, color: C.textMut, lineHeight: 1.4, margin: "6px 0 3px" }}>
                <em style={{ color: C.textSec }}>Trigger:</em> {crisis.trigger}
              </p>
              <p style={{ fontSize: 10, color: C.textMut, lineHeight: 1.4, margin: 0 }}>
                {crisis.outcome}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
