# 🦋 Economic Butterfly Effect Simulator

An interactive platform for understanding how small economic changes cascade into major macroeconomic outcomes.

## Quick Start (No Docker)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Redis (optional — app works without it, just no caching)

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## Quick Start (Docker)

```bash
docker-compose up --build
```

Open http://localhost:5173

---

## Optional: FRED API Key (real data)

Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html

```bash
# backend/.env
FRED_API_KEY=your_key_here
```

Without a key the app runs on realistic synthetic baseline data.

---

## Project Structure

```
butterfly-simulator/
├── frontend/          # Vite + React app
│   └── src/
│       ├── components/
│       │   ├── reality/       # Reality mode panels
│       │   ├── simulation/    # Policy levers, graph, timeline
│       │   ├── prediction/    # Risk scores, narratives, SHAP
│       │   └── shared/        # Gauges, cards
│       ├── hooks/             # useRealityData, useSimulation, usePrediction
│       ├── services/          # API client, WebSocket manager
│       ├── engine/            # Client-side sim fallback
│       └── App.jsx
│
└── backend/           # FastAPI server
    ├── main.py
    ├── simulation/    # Causal graph propagation engine
    ├── ml/            # DTW, XGBoost, HMM, scoring
    ├── data/          # FRED + synthetic data ingestion
    ├── api/           # Route handlers
    └── explainability/ # SHAP + narrative builder
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /reality/snapshot | Current economic state + risk scores |
| GET | /reality/history | Historical indicator time series |
| POST | /simulate/run | Run butterfly propagation |
| POST | /predict/score | ML risk scoring |
| POST | /predict/explain | SHAP explanation + narrative |
| GET | /crises/library | Historical crisis library |
| WS | /simulate/stream | Real-time step streaming |
=======
# Butterfly-Simulator
>>>>>>> a73553747041772b0f741c38d8aa16b5372d8ad4
