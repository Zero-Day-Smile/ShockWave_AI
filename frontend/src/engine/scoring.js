// Client-side ML scoring — mirrors backend/ml/scoring.py

import { CRISES_LIBRARY } from "./crises.js";

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }

export function estimateRecessionProbability(state) {
  const yieldCurve  = -(state.interest_rate * 0.6 + (state.credit_supply ?? 0) * 0.4);
  const demand      = -((state.consumer_spend ?? 0) + state.consumer_conf) / 2;
  const gdpDrag     = -(state.gdp_growth ?? 0) * 0.8;
  const creditStress = (state.interest_rate > 0.4 && (state.credit_supply ?? 0) < -0.1) ? 0.25 : 0;
  const empDrag     = -(state.employment ?? 0) * 0.3;
  const raw = yieldCurve * 0.30 + demand * 0.28 + gdpDrag * 0.20 + empDrag * 0.12 + creditStress + 0.35;
  return clamp(sigmoid(raw * 2.2), 0.03, 0.97);
}

export function estimateBubbleRisk(state) {
  const raw = (state.asset_prices ?? 0) * 0.45 + (state.credit_supply ?? 0) * 0.30 +
              (state.ai_adoption ?? 0) * 0.15 + state.consumer_conf * 0.10;
  return clamp(sigmoid(raw * 1.8), 0.05, 0.95);
}

export function estimateInflationRisk(state) {
  const raw = (state.inflation ?? 0) * 0.45 + (state.energy_prices ?? 0) * 0.28 +
              (state.gov_spending ?? 0) * 0.15 + (state.consumer_spend ?? 0) * 0.12;
  return clamp(sigmoid(raw * 1.6 + 0.2), 0.05, 0.95);
}

export function detectRegime(state, recProb, bubbleRisk, inflRisk) {
  if (recProb > 0.72) return "Acute crisis";
  if (recProb > 0.58) return "Contraction risk";
  if (inflRisk > 0.62 && recProb > 0.38) return "Stagflation pressure";
  if (bubbleRisk > 0.65) return "Overheating";
  if (recProb > 0.44) return "Late cycle slowdown";
  if ((state.gdp_growth ?? 0) > 0.30 && inflRisk < 0.38) return "Strong expansion";
  return "Stable expansion";
}

function euclideanDist(state, crisisState) {
  const keys = Object.keys(crisisState);
  if (!keys.length) return 1;
  const sq = keys.reduce((acc, k) => {
    const diff = (state[k] ?? 0) - (crisisState[k] ?? 0);
    return acc + diff * diff;
  }, 0);
  return Math.sqrt(sq / keys.length);
}

export function compareToCrises(state, trajectory = null) {
  return CRISES_LIBRARY.map(crisis => {
    let dist;
    if (trajectory && trajectory.length > 2) {
      const dists = trajectory.map(s => euclideanDist(s, crisis.state));
      const weights = dists.map((_, i) => 0.5 + 0.5 * (i / dists.length));
      dist = dists.reduce((a, d, i) => a + d * weights[i], 0) / weights.reduce((a, w) => a + w, 0);
    } else {
      dist = euclideanDist(state, crisis.state);
    }
    const similarity = Math.exp(-dist / 1.2);
    return { ...crisis, similarity: Math.round(similarity * 1000) / 1000 };
  }).sort((a, b) => b.similarity - a.similarity);
}

export function computeFeatureImportance(state, recessionProb) {
  const base = recessionProb;
  const delta = 0.10;
  const features = [
    { feature_id: "interest_rate",  label: "Interest rate" },
    { feature_id: "credit_supply",  label: "Credit conditions" },
    { feature_id: "consumer_conf",  label: "Consumer confidence" },
    { feature_id: "asset_prices",   label: "Asset price level" },
    { feature_id: "gdp_growth",     label: "GDP trajectory" },
    { feature_id: "inflation",      label: "Inflation pressure" },
    { feature_id: "energy_prices",  label: "Energy price shock" },
    { feature_id: "employment",     label: "Employment level" },
  ].map(({ feature_id, label }) => {
    const perturbed = { ...state, [feature_id]: Math.min(1, (state[feature_id] ?? 0) + delta) };
    const probUp = estimateRecessionProbability(perturbed);
    const shap = (probUp - base) / delta;
    return {
      feature_id, label,
      value: state[feature_id] ?? 0,
      shap: Math.round(shap * 10000) / 10000,
      impact: Math.abs(shap),
      direction: shap > 0 ? "positive" : "negative",
    };
  });
  features.sort((a, b) => b.impact - a.impact);
  return features.slice(0, 6);
}

export function buildNarrative(features, crisisSimilarities, regime, recessionProb) {
  const topCrisis = crisisSimilarities[0];
  const drivers = features.filter(f => f.impact > 0.05).slice(0, 2);
  const driverText = drivers.length === 0
    ? "Subdued economic conditions"
    : drivers.length === 1
      ? drivers[0].label
      : `${drivers[0].label} combined with ${drivers[1].label.toLowerCase()}`;

  const crisisText = topCrisis && topCrisis.similarity > 0.25
    ? ` Conditions show ${Math.round(topCrisis.similarity * 100)}% similarity to the ${topCrisis.name}.`
    : "";

  const outlook = recessionProb > 0.55
    ? "Recessionary dynamics are building — policy response window is narrowing."
    : recessionProb > 0.35
      ? "Economy retains expansion characteristics, though vulnerabilities are present."
      : "Economic fundamentals appear relatively stable under current conditions.";

  return `${driverText} patterns are the dominant risk factor.${crisisText} ${outlook} Regime: ${regime}.`;
}

export function scoreState(state, trajectory = null) {
  const recessionProb  = estimateRecessionProbability(state);
  const bubbleRisk     = estimateBubbleRisk(state);
  const inflationRisk  = estimateInflationRisk(state);
  const regime         = detectRegime(state, recessionProb, bubbleRisk, inflationRisk);
  const features       = computeFeatureImportance(state, recessionProb);
  const crisisSims     = compareToCrises(state, trajectory);
  const narrative      = buildNarrative(features, crisisSims, regime, recessionProb);

  return {
    recession_probability: recessionProb,
    bubble_risk: bubbleRisk,
    inflation_risk: inflationRisk,
    regime,
    features,
    crisis_similarities: crisisSims,
    narrative,
  };
}
