export const CRISES_LIBRARY = [
  {
    id: "2008", name: "2008 Financial Crisis", years: "2007–2009",
    trigger: "Subprime mortgage collapse, Lehman Brothers failure",
    outcome: "Global GDP fell 2.1%, US unemployment peaked 10%, S&P -57%",
    state: { interest_rate: -0.80, credit_supply: +0.90, asset_prices: +0.90, inflation: +0.20, employment: +0.30, gdp_growth: +0.40, consumer_conf: +0.20, consumer_spend: +0.30, gov_spending: -0.10 },
  },
  {
    id: "2001", name: "2001 Dot-com Bust", years: "2000–2002",
    trigger: "Tech equity bubble collapse, 9/11 shock",
    outcome: "NASDAQ fell 78%, mild recession, unemployment 6.3%",
    state: { interest_rate: -0.30, ai_adoption: +0.80, asset_prices: +0.95, credit_supply: +0.40, gdp_growth: -0.10, consumer_conf: +0.10, inflation: +0.15 },
  },
  {
    id: "1970s", name: "1970s Stagflation", years: "1973–1982",
    trigger: "OPEC oil embargo, loose monetary policy",
    outcome: "CPI peaked 14.8%, two recessions, unemployment 9%",
    state: { energy_prices: +0.95, inflation: +0.90, consumer_conf: -0.80, employment: -0.50, gdp_growth: -0.40, interest_rate: +0.60, consumer_spend: -0.40 },
  },
  {
    id: "2020", name: "2020 COVID Shock", years: "2020",
    trigger: "Global pandemic, supply chain collapse",
    outcome: "US GDP fell 19.2% in Q2, 22M jobs lost in 2 months",
    state: { consumer_conf: -0.90, consumer_spend: -0.80, employment: -0.70, gov_spending: +0.90, gdp_growth: -0.70, credit_supply: +0.20, asset_prices: -0.40 },
  },
  {
    id: "1997", name: "1997 Asian Crisis", years: "1997–1998",
    trigger: "Currency peg failures, contagion to Russia/LTCM",
    outcome: "GDP contractions across SE Asia, global credit crunch",
    state: { credit_supply: +0.70, asset_prices: +0.60, consumer_conf: -0.40, inflation: +0.40, gdp_growth: +0.20, interest_rate: -0.20 },
  },
  {
    id: "1987", name: "1987 Black Monday", years: "1987",
    trigger: "Portfolio insurance cascades, overvalued equities",
    outcome: "Dow fell 22.6% in one day, swift recovery followed",
    state: { asset_prices: +0.85, credit_supply: +0.50, interest_rate: +0.40, inflation: +0.30, consumer_conf: +0.40 },
  },
];
