export const C = {
  bg:        "#0a0a12",
  surface:   "rgba(255,255,255,0.03)",
  border:    "rgba(255,255,255,0.07)",
  borderHi:  "rgba(255,255,255,0.14)",
  gold:      "#e8c97a",
  goldDim:   "rgba(232,201,122,0.15)",
  green:     "#2a9d6e",
  red:       "#e05a3a",
  blue:      "#6b9fcc",
  textPrim:  "rgba(255,255,255,0.88)",
  textSec:   "rgba(255,255,255,0.45)",
  textMut:   "rgba(255,255,255,0.22)",
  mono:      "'IBM Plex Mono', monospace",
  sans:      "'IBM Plex Sans', sans-serif",
};

export function riskColor(v) {
  if (v > 0.65) return C.red;
  if (v > 0.40) return C.gold;
  return C.green;
}

export function valueColor(v) {
  if (v > 0.20)  return C.green;
  if (v < -0.20) return C.red;
  return C.gold;
}

export const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "14px 16px",
};

export const sectionLabel = {
  fontSize: 9,
  color: C.textMut,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: 10,
  fontFamily: C.mono,
};
