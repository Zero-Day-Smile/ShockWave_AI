import { riskColor, C } from "../../styles/tokens.js";

export default function RiskGauge({ label, value }) {
  const pct   = Math.round(value * 100);
  const level = pct > 65 ? "HIGH" : pct > 40 ? "MOD" : "LOW";
  const color = riskColor(value);
  const r     = 30, cx = 40, cy = 42;
  const circ  = 2 * Math.PI * r;
  const arc   = circ * 0.75;
  const filled = arc * value;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={80} height={60} viewBox="0 0 80 60">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth={5}
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round" />
        {/* Fill */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1), stroke 0.5s" }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle"
          fill={color} fontSize={12} fontWeight={600} fontFamily={C.mono}>
          {pct}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
          fill={color} fontSize={7} fontWeight={500} fontFamily={C.mono} opacity={0.85}>
          {level}
        </text>
      </svg>
      <span style={{ fontSize: 9, color: C.textMut, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: C.mono }}>
        {label}
      </span>
    </div>
  );
}
