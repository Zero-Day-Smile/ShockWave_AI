import { C } from "../../styles/tokens.js";

const LEVERS = [
  { id: "interest_rate",  label: "Interest rate",      desc: "Central bank benchmark rate. Higher → tighter credit.",    icon: "%" },
  { id: "gov_spending",   label: "Fiscal stimulus",    desc: "Government spending change as % of GDP.",                  icon: "¤" },
  { id: "energy_prices",  label: "Energy prices",      desc: "Oil / gas price shock relative to baseline.",               icon: "⚡" },
  { id: "ai_adoption",    label: "AI adoption",        desc: "Automation & productivity structural shift speed.",          icon: "◈" },
  { id: "consumer_conf",  label: "Consumer sentiment", desc: "Household confidence in economic outlook.",                 icon: "↯" },
  { id: "credit_supply",  label: "Credit availability",desc: "Bank lending conditions and credit standards.",             icon: "⊕" },
];

export default function PolicyPanel({ deltas, onChange }) {
  return (
    <div>
      {LEVERS.map(lever => {
        const v = deltas[lever.id] ?? 0;
        const dir   = v > 0.05 ? "▲" : v < -0.05 ? "▼" : "—";
        const dirCol = v > 0.05 ? C.green : v < -0.05 ? C.red : C.textMut;

        return (
          <div key={lever.id} style={{
            background: C.surface,
            border: `1px solid ${Math.abs(v) > 0.05 ? C.borderHi : C.border}`,
            borderRadius: 8,
            padding: "11px 13px",
            marginBottom: 7,
            transition: "border-color 0.2s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: C.textMut, fontFamily: "monospace" }}>{lever.icon}</span>
                <span style={{ fontSize: 12, color: C.textPrim, fontWeight: 500 }}>{lever.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: dirCol, fontFamily: C.mono, fontWeight: 600 }}>{dir}</span>
                <span style={{ fontSize: 11, color: C.textMut, fontFamily: C.mono, minWidth: 28, textAlign: "right" }}>
                  {v > 0 ? "+" : ""}{Math.round(v * 100)}
                </span>
              </div>
            </div>
            <input
              type="range" min={-100} max={100} step={1}
              value={Math.round(v * 100)}
              onChange={e => onChange(lever.id, parseInt(e.target.value) / 100)}
              style={{ width: "100%" }}
            />
            <p style={{ fontSize: 10, color: C.textMut, margin: "4px 0 0", lineHeight: 1.4 }}>
              {lever.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
}
