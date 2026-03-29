"""
Data Ingestion Layer
Fetches real macroeconomic data from FRED API.
Falls back to realistic synthetic baseline when API key is unavailable.
"""
import os
import math
import random
from typing import Dict, List
from datetime import datetime, timedelta

import requests

FRED_BASE = "https://api.fred.stlouisfed.org/series/observations"

# FRED series IDs for key indicators
FRED_SERIES = {
    "FEDFUNDS":   ("interest_rate",  "Federal Funds Rate"),
    "CPIAUCSL":   ("inflation",      "CPI All Items"),
    "UNRATE":     ("employment",     "Unemployment Rate"),
    "GDP":        ("gdp_growth",     "Real GDP"),
    "UMCSENT":    ("consumer_conf",  "Consumer Sentiment"),
    "SP500":      ("asset_prices",   "S&P 500"),
    "DPCERD3Q086SBEA": ("consumer_spend", "Consumer Spending"),
}

# Normalization bounds (min, max) for each indicator → [-1, 1]
NORM_BOUNDS = {
    "interest_rate":  (0.0, 20.0),
    "inflation":      (90.0, 310.0),   # CPI index
    "employment":     (3.0, 15.0),     # unemployment (inverted)
    "gdp_growth":     (-10.0, 10.0),   # QoQ %
    "consumer_conf":  (50.0, 110.0),
    "asset_prices":   (500.0, 6000.0),
    "consumer_spend": (8000.0, 20000.0),
}

# Realistic synthetic baseline (approximates 2025 conditions)
SYNTHETIC_BASELINE: Dict[str, float] = {
    "interest_rate":  +0.55,   # Fed funds ~5.25%
    "gov_spending":   +0.10,   # Slight fiscal expansion
    "energy_prices":  +0.30,   # Elevated but stable
    "ai_adoption":    +0.60,   # Rapid structural shift
    "consumer_conf":  +0.15,   # Cautiously positive
    "credit_supply":  +0.05,   # Tight but functional
    "inflation":      +0.35,   # Above target, decelerating
    "employment":     +0.20,   # Labour market solid
    "asset_prices":   +0.55,   # Elevated valuations
    "consumer_spend": +0.22,   # Resilient
    "gdp_growth":     +0.18,   # Modest positive
}


def normalize(value: float, lo: float, hi: float, invert: bool = False) -> float:
    """Map a raw value into [-1, 1]."""
    scaled = 2 * (value - lo) / (hi - lo) - 1
    scaled = max(-1.0, min(1.0, scaled))
    return -scaled if invert else scaled


def _fetch_fred_series(series_id: str, api_key: str, limit: int = 1) -> float | None:
    try:
        resp = requests.get(FRED_BASE, params={
            "series_id": series_id,
            "api_key": api_key,
            "file_type": "json",
            "sort_order": "desc",
            "limit": limit,
        }, timeout=5)
        resp.raise_for_status()
        obs = resp.json().get("observations", [])
        for o in obs:
            try:
                return float(o["value"])
            except (ValueError, KeyError):
                continue
    except Exception:
        pass
    return None


def get_current_snapshot(api_key: str = "demo") -> Dict[str, float]:
    """
    Fetch current economic snapshot.
    Uses FRED when a valid API key is provided, otherwise returns synthetic baseline.
    """
    if api_key == "demo" or not api_key:
        return dict(SYNTHETIC_BASELINE)

    state = dict(SYNTHETIC_BASELINE)

    # Interest rate
    v = _fetch_fred_series("FEDFUNDS", api_key)
    if v is not None:
        state["interest_rate"] = normalize(v, 0, 20)

    # CPI (inflation proxy)
    v = _fetch_fred_series("CPIAUCSL", api_key)
    if v is not None:
        state["inflation"] = normalize(v, 90, 310)

    # Unemployment (inverted: lower unemployment → higher employment)
    v = _fetch_fred_series("UNRATE", api_key)
    if v is not None:
        state["employment"] = normalize(v, 3, 15, invert=True)

    # Consumer sentiment
    v = _fetch_fred_series("UMCSENT", api_key)
    if v is not None:
        state["consumer_conf"] = normalize(v, 50, 110)

    return state


def get_historical_series(
    indicator: str,
    years: int = 20,
    api_key: str = "demo",
) -> List[Dict]:
    """
    Returns a time series for a given indicator.
    Synthetic when no API key, real FRED data when available.
    """
    if api_key == "demo" or not api_key:
        return _synthetic_history(indicator, years)

    series_map = {
        "inflation": "CPIAUCSL",
        "interest_rate": "FEDFUNDS",
        "employment": "UNRATE",
        "gdp_growth": "A191RL1Q225SBEA",
        "consumer_conf": "UMCSENT",
        "asset_prices": "SP500",
    }

    series_id = series_map.get(indicator)
    if not series_id:
        return _synthetic_history(indicator, years)

    try:
        start = (datetime.now() - timedelta(days=years * 365)).strftime("%Y-%m-%d")
        resp = requests.get(FRED_BASE, params={
            "series_id": series_id,
            "api_key": api_key,
            "file_type": "json",
            "observation_start": start,
            "frequency": "q",
        }, timeout=8)
        resp.raise_for_status()
        obs = resp.json().get("observations", [])
        lo, hi = NORM_BOUNDS.get(indicator, (-5, 5))
        invert = indicator == "employment"
        return [
            {
                "date": o["date"],
                "raw": float(o["value"]),
                "normalized": normalize(float(o["value"]), lo, hi, invert),
            }
            for o in obs
            if o["value"] not in (".", "")
        ]
    except Exception:
        return _synthetic_history(indicator, years)


def _synthetic_history(indicator: str, years: int = 20) -> List[Dict]:
    """Generate plausible synthetic history with trend + cycles + noise."""
    random.seed(hash(indicator) % 9999)
    base = SYNTHETIC_BASELINE.get(indicator, 0.0)
    result = []
    quarters = years * 4
    now = datetime.now()

    for i in range(quarters, 0, -1):
        t = i / quarters
        # Long-run trend toward current baseline
        trend = base * (1 - t) + base * 0.3 * t
        # Business cycle (8-year period)
        cycle = 0.25 * math.sin(2 * math.pi * t * 2.5)
        # Noise
        noise = (random.random() - 0.5) * 0.15
        value = max(-0.95, min(0.95, trend + cycle + noise))
        date = (now - timedelta(days=i * 91)).strftime("%Y-%m-%d")
        result.append({"date": date, "raw": None, "normalized": round(value, 4)})

    return result
