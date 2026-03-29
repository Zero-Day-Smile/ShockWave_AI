import { C, card, sectionLabel } from "../../styles/tokens.js";

export function SectionLabel({ children, extra }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={sectionLabel}>{children}</span>
      {extra && <span style={{ fontSize: 9, color: C.gold, fontFamily: C.mono }}>{extra}</span>}
    </div>
  );
}

export function Card({ children, style = {}, accent = false }) {
  return (
    <div style={{
      ...card,
      marginBottom: 12,
      borderColor: accent ? "rgba(232,201,122,0.25)" : card.border,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function RegimePill({ regime }) {
  const high = regime.includes("risk") || regime.includes("crisis") || regime.includes("Stagflation");
  const mod  = regime.includes("Overheating") || regime.includes("slowdown");
  const bg   = high ? "rgba(224,90,58,0.15)" : mod ? "rgba(232,201,122,0.12)" : "rgba(42,157,110,0.12)";
  const col  = high ? C.red : mod ? C.gold : C.green;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 4,
      background: bg, color: col, fontSize: 11,
      fontFamily: C.mono, fontWeight: 600,
    }}>
      {regime}
    </span>
  );
}
