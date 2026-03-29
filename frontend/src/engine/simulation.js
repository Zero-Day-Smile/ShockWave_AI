// Client-side simulation engine
// Used as fallback when backend is unavailable, and for instant preview

export const GRAPH_EDGES = [
  { from: "interest_rate",  to: "credit_supply",   weight: -0.72 },
  { from: "interest_rate",  to: "asset_prices",    weight: -0.55 },
  { from: "interest_rate",  to: "inflation",       weight: -0.40 },
  { from: "gov_spending",   to: "gdp_growth",      weight: +0.58 },
  { from: "gov_spending",   to: "inflation",       weight: +0.32 },
  { from: "gov_spending",   to: "employment",      weight: +0.44 },
  { from: "energy_prices",  to: "inflation",       weight: +0.82 },
  { from: "energy_prices",  to: "consumer_conf",   weight: -0.55 },
  { from: "energy_prices",  to: "gdp_growth",      weight: -0.38 },
  { from: "ai_adoption",    to: "employment",      weight: -0.42 },
  { from: "ai_adoption",    to: "gdp_growth",      weight: +0.28 },
  { from: "ai_adoption",    to: "asset_prices",    weight: +0.35 },
  { from: "consumer_conf",  to: "consumer_spend",  weight: +0.74 },
  { from: "consumer_conf",  to: "asset_prices",    weight: +0.38 },
  { from: "credit_supply",  to: "asset_prices",    weight: +0.62 },
  { from: "credit_supply",  to: "gdp_growth",      weight: +0.42 },
  { from: "credit_supply",  to: "consumer_spend",  weight: +0.35 },
  { from: "inflation",      to: "consumer_conf",   weight: -0.52 },
  { from: "inflation",      to: "employment",      weight: -0.28 },
  { from: "inflation",      to: "asset_prices",    weight: +0.20 },
  { from: "employment",     to: "consumer_spend",  weight: +0.62 },
  { from: "employment",     to: "consumer_conf",   weight: +0.50 },
  { from: "asset_prices",   to: "consumer_conf",   weight: +0.30 },
  { from: "asset_prices",   to: "credit_supply",   weight: +0.25 },
  { from: "consumer_spend", to: "gdp_growth",      weight: +0.52 },
  { from: "consumer_spend", to: "inflation",       weight: +0.22 },
  { from: "gdp_growth",     to: "employment",      weight: +0.50 },
  { from: "gdp_growth",     to: "consumer_conf",   weight: +0.40 },
];

const LAG = {
  gdp_growth: 0.60, employment: 0.50, inflation: 0.70,
  asset_prices: 0.90, consumer_conf: 0.85, consumer_spend: 0.80, credit_supply: 0.75,
};

export const ALL_NODES = [
  "interest_rate", "gov_spending", "energy_prices", "ai_adoption",
  "consumer_conf", "credit_supply", "inflation", "employment",
  "asset_prices", "consumer_spend", "gdp_growth",
];

export const POLICY_NODES = new Set([
  "interest_rate", "gov_spending", "energy_prices", "ai_adoption", "consumer_conf", "credit_supply"
]);

export const NODE_LABELS = {
  interest_rate: "Rate", gov_spending: "Spending", energy_prices: "Energy",
  ai_adoption: "AI", consumer_conf: "Confidence", credit_supply: "Credit",
  inflation: "Inflation", employment: "Jobs", asset_prices: "Assets",
  consumer_spend: "Demand", gdp_growth: "GDP",
};

export const NODE_FULL_LABELS = {
  interest_rate: "Interest Rate", gov_spending: "Gov. Spending", energy_prices: "Energy Prices",
  ai_adoption: "AI Adoption", consumer_conf: "Consumer Confidence", credit_supply: "Credit Supply",
  inflation: "Inflation", employment: "Employment", asset_prices: "Asset Prices",
  consumer_spend: "Consumer Spending", gdp_growth: "GDP Growth",
};

export const REALITY_STATE = {
  interest_rate:  +0.55,
  gov_spending:   +0.10,
  energy_prices:  +0.30,
  ai_adoption:    +0.60,
  consumer_conf:  +0.15,
  credit_supply:  +0.05,
  inflation:      +0.35,
  employment:     +0.20,
  asset_prices:   +0.55,
  consumer_spend: +0.22,
  gdp_growth:     +0.18,
};

function clamp(v, lo = -1, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

function buildAdjacency() {
  const adj = {};
  ALL_NODES.forEach(n => { adj[n] = []; });
  GRAPH_EDGES.forEach(({ from, to, weight }) => adj[from].push({ to, weight }));
  return adj;
}

const ADJACENCY = buildAdjacency();

export function propagate(initialState, deltas, steps = 16, noise = 0.025) {
  let state = { ...initialState };
  for (const [k, v] of Object.entries(deltas)) {
    if (k in state) state[k] = clamp(state[k] + v);
  }
  const history = [{ ...state }];

  for (let t = 0; t < steps; t++) {
    const next = { ...state };
    for (const src of ALL_NODES) {
      for (const { to, weight } of ADJACENCY[src]) {
        const influence = weight * state[src];
        const dampened  = influence * (1 - Math.abs(state[to]) * 0.35);
        const noisy     = dampened + (Math.random() - 0.5) * 2 * noise;
        const lag       = LAG[to] ?? 1.0;
        next[to] = clamp(state[to] + noisy * lag * 0.25);
      }
    }
    state = next;
    history.push({ ...state });
  }
  return history;
}
