import { C } from "../../styles/tokens.js";

const TRACKED = [
  { id: "gdp_growth",     label: "GDP",        color: C.gold },
  { id: "inflation",      label: "Inflation",  color: "#e05a3a" },
  { id: "employment",     label: "Jobs",       color: "#2a9d6e" },
  { id: "asset_prices",   label: "Assets",     color: "#6b9fcc" },
];

export default function TimelineChart({ trajectory }) {
  const W = 480, H = 130;
  const pad = { l: 28, r: 52, t: 10, b: 22 };
  const iW  = W - pad.l - pad.r;
  const iH  = H - pad.t - pad.b;

  if (!trajectory || trajectory.length < 2) {
    return (
      <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: C.textMut, fontFamily: C.mono }}>
          run simulation to see timeline
        </span>
      </div>
    );
  }

  const steps = trajectory.length;
  const toX = (i) => pad.l + (i / (steps - 1)) * iW;
  const toY = (v) => pad.t + ((1 - (v + 1) / 2)) * iH;

  const buildPath = (nodeId) =>
    trajectory.map((s, i) =>
      `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s[nodeId] ?? 0).toFixed(1)}`
    ).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Gridlines */}
      {[-1, 0, 1].map(v => {
        const y = toY(v);
        return (
          <g key={v}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={pad.l - 3} y={y} textAnchor="end" dominantBaseline="central"
              fontSize={7} fill={C.textMut} fontFamily={C.mono}>
              {v > 0 ? "+" : ""}{v}
            </text>
          </g>
        );
      })}

      {/* Zero baseline */}
      <line x1={pad.l} y1={toY(0)} x2={W - pad.r} y2={toY(0)}
        stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} strokeDasharray="3 3" />

      {/* Lines */}
      {TRACKED.map(({ id, color }) => (
        <path key={id} d={buildPath(id)}
          fill="none" stroke={color} strokeWidth={1.5} opacity={0.85}
        />
      ))}

      {/* End labels */}
      {TRACKED.map(({ id, label, color }) => {
        const lastVal = trajectory[trajectory.length - 1][id] ?? 0;
        return (
          <text key={id}
            x={W - pad.r + 4}
            y={toY(lastVal)}
            fontSize={7.5} fill={color} fontFamily={C.mono} dominantBaseline="central">
            {label}
          </text>
        );
      })}

      {/* X-axis labels */}
      <text x={pad.l} y={H - 4} fontSize={7} fill={C.textMut} fontFamily={C.mono}>t=0</text>
      <text x={W - pad.r} y={H - 4} fontSize={7} fill={C.textMut} fontFamily={C.mono} textAnchor="end">
        t+{steps}
      </text>
    </svg>
  );
}
