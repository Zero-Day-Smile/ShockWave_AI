import { useRef } from "react";
import { GRAPH_EDGES, ALL_NODES, NODE_LABELS, POLICY_NODES } from "../../engine/simulation.js";
import { C } from "../../styles/tokens.js";

// Fixed layout positions [0-1] relative to SVG canvas
const POSITIONS = {
  interest_rate:  { x: 0.09, y: 0.10 },
  gov_spending:   { x: 0.09, y: 0.30 },
  energy_prices:  { x: 0.09, y: 0.50 },
  ai_adoption:    { x: 0.09, y: 0.70 },
  consumer_conf:  { x: 0.09, y: 0.90 },
  credit_supply:  { x: 0.40, y: 0.15 },
  inflation:      { x: 0.40, y: 0.42 },
  employment:     { x: 0.40, y: 0.68 },
  asset_prices:   { x: 0.40, y: 0.90 },
  consumer_spend: { x: 0.72, y: 0.42 },
  gdp_growth:     { x: 0.72, y: 0.75 },
};

function nodeColor(v) {
  if (v > 0.30)  return "#2a9d6e";
  if (v > 0.08)  return "#5ba88a";
  if (v > -0.08) return "rgba(255,255,255,0.32)";
  if (v > -0.30) return "#c07040";
  return "#e05a3a";
}

export default function CausalGraph({ state, trajectory, animStep }) {
  const W = 500, H = 330;

  const getVal = (id) => {
    if (trajectory && trajectory.length > 0 && animStep >= 0) {
      const step = Math.min(animStep, trajectory.length - 1);
      return trajectory[step][id] ?? state[id] ?? 0;
    }
    return state[id] ?? 0;
  };

  const px = (id) => ({
    x: POSITIONS[id].x * W,
    y: POSITIONS[id].y * H,
  });

  const isAnimating = trajectory && trajectory.length > 0 && animStep >= 0;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Edges */}
      {GRAPH_EDGES.map((edge, i) => {
        const from = px(edge.from);
        const to   = px(edge.to);
        const fromVal = getVal(edge.from);
        const intensity = Math.min(1, Math.abs(fromVal * edge.weight));
        const strokeW = isAnimating ? Math.max(0.4, intensity * 3) : 0.5;
        const opacity  = isAnimating ? Math.min(0.75, 0.12 + intensity * 0.65) : 0.11;
        const color    = edge.weight > 0 ? "#2a9d6e" : "#e05a3a";

        return (
          <line key={i}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={color}
            strokeWidth={strokeW}
            strokeOpacity={opacity}
            style={{ transition: "stroke-width 0.35s, stroke-opacity 0.35s" }}
          />
        );
      })}

      {/* Nodes */}
      {ALL_NODES.map(id => {
        const { x, y } = px(id);
        const v   = getVal(id);
        const col = nodeColor(v);
        const r   = POLICY_NODES.has(id) ? 18 : 14;
        const isPol = POLICY_NODES.has(id);

        return (
          <g key={id}>
            {/* Glow ring */}
            <circle cx={x} cy={y} r={r + 5} fill={col} opacity={isAnimating ? 0.10 : 0.05}
              style={{ transition: "opacity 0.4s" }} />
            {/* Node body */}
            <circle cx={x} cy={y} r={r}
              fill="rgba(10,10,18,0.88)" stroke={col}
              strokeWidth={isPol ? 2 : 1.5}
              style={{ transition: "stroke 0.45s" }}
            />
            {/* Label */}
            <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="central"
              fontSize={isPol ? 7.5 : 6.5} fill={col}
              fontFamily={C.mono} fontWeight={600}>
              {NODE_LABELS[id]}
            </text>
            {/* Value */}
            <text x={x} y={y + 9} textAnchor="middle" dominantBaseline="central"
              fontSize={6} fill={col} fontFamily={C.mono} opacity={0.75}>
              {v >= 0 ? "+" : ""}{Math.round(v * 100)}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <line x1={8}  y1={H - 14} x2={22} y2={H - 14} stroke="#2a9d6e" strokeWidth={1.5} />
      <text x={26}  y={H - 14} fill={C.textMut} fontSize={7.5} dominantBaseline="central" fontFamily={C.sans}>positive</text>
      <line x1={76} y1={H - 14} x2={90} y2={H - 14} stroke="#e05a3a" strokeWidth={1.5} />
      <text x={94}  y={H - 14} fill={C.textMut} fontSize={7.5} dominantBaseline="central" fontFamily={C.sans}>negative</text>
      {isAnimating && (
        <text x={W - 6} y={H - 14} textAnchor="end" fill={C.gold} fontSize={7.5} fontFamily={C.mono}>
          step {Math.min(animStep + 1, trajectory.length)} / {trajectory.length}
        </text>
      )}
    </svg>
  );
}
