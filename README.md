# FlowMind – Autonomous AI Operations Layer for Logistics

FlowMind is a hackathon-winning, production-style Agentic AI system designed to continuously monitor logistics telemetry, reason about emerging risks, decide optimal interventions, execute actions with safety guardrails, and learn from outcomes.

## System Architecture

FlowMind follows a modern AI operations microservice architecture:
1. **Simulation Engine (`backend/simulation/`)**: Continuously generates dynamic logistics data, modeling 2000 shipments, variable warehouse load, and fluctuating carrier reliabilities across Indian cities.
2. **Machine Learning Predictor (`backend/models/`)**: A trained `RandomForestClassifier` predicting delay probability based on real-time distance, ETA, carrier reliability, and network congestion.
3. **Agent & Decision Engine (`backend/agent/`)**: The core autonomous loop. Orchestrates the **Observe → Reason → Decide → Act → Learn** pipeline. It translates predictive probabilities into deterministic operational reasoning.
4. **Tools Layer (`backend/tools/`)**: The actuating layer allowing the Agent to interact with the physical world (via simulation). Includes `reroute`, `switch_carrier`, `prioritize`, and `escalate_to_operator`.
5. **Memory & Learning (`backend/agent/memory.py`)**: An SQLite-based memory system that ensures actions are not duplicated (breaking loops) and stores detailed causal reasoning for post-mortem learning.
6. **API Layer (`backend/api/`)**: A FastAPI server pushing state changes and agent logs.
7. **Frontend Dashboard (`frontend/`)**: A Vite + React + TailwindCSS application visualizing the system. Built with dark-mode glassmorphism.

## Agent Workflow

The core cycle runs continuously in the background of the FastAPI app:

1. **Observe**: Telemetry (telemetry, delay signals, distance, ETA) is pulled from `shipments.csv` and cross-referenced with global system state (`system_state.json` for warehouse loads).
2. **Reason**: The AI invokes the `DelayPredictor` ML model to calculate a composite `risk_score` for each shipment, combining delay probability with operational signals.
3. **Decide**: The `DecisionEngine` evaluates strategies to mitigate the highest risks while keeping costs minimal (e.g. `risk > 0.85 -> Reroute`, `risk > 0.65 -> Prioritize`).
4. **Act**: The Agent triggers the specific actuator tool (e.g., `switch_carrier_tool()`). Guardrails prevent high-risk actions without triggering the `alert_operator()` tool for human-in-the-loop review.
5. **Learn**: The final action and full text-based reasoning string are saved into `agent_memory.db`. The Agent checks this memory during the *Decide* phase to ensure it doesn't repeatedly intervene on the same shipment.

## Hackathon Exclusives

To make this a true winning demo, the system includes:
- **Interactive Chaos Engine (`POST /api/chaos`)**: A dedicated interface inside the React UI allowing judges to press an "Inject Chaos" button. This forces a simulated network crash (e.g. 99% warehouse load), immediately displaying the Agent's autonomous recovery time.
- **LLM-style Explanations (XAI)**: The deterministic strings in the reasoning phase produce nuanced, human-readable rationalizations mimicking natural generative AI outputs.
- **Live Recharts Telemetry**: Dynamic React charts graph the current network's health boundaries over time to visually prove stabilization after Agent intervention.
- **Dockerized Environment**: The entire monolithic Agentic loop can be deployed anywhere with `docker-compose up`.

## Phase 12: Dynamic Configuration (Removing Hardcoding)
To make the platform production-ready and fully dynamic, we will extract all hardcoded values into external configurations:

1. **Environment Variables (`.env`)**:
   - Replace the hardcoded `http://localhost:8000/api` in the React frontend with `import.meta.env.VITE_API_URL`.
   - Store API keys, Database URLs, and Server Ports in a backend `.env`.
2. **Dynamic Rule Thresholds (`config.py`)**:
   - Extract "magic numbers" in the `decision_engine.py` (e.g. `final_risk > 0.90`, `carrier_reliability < 0.70`) into a Pydantic Settings class so they can be tweaked on the fly via environment variables without editing Python code.
3. **Externalized Simulation Data (`assets/logistics_network.json`)**:
   - Move the hardcoded lists of cities (`"Mumbai", "Delhi", ...`) and carriers (`"FedEx", "DHL", ...`) in `shipment_generator.py` into a configurable JSON schema file. This allows admins to add new cities/carriers without touching the engine logic.
4. **Live LLM API Integration**:
   - Replace the hardcoded `/agent/decision_engine.py` text generation templates with a live Langchain call using `GROQ_API_KEY` or `OPENAI_API_KEY` from the environment.

## Running the Application

### Option A: Standard Setup (Requires Python & Node)

1. **Start the Logistics Simulation & Backend**:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt # (Contains fastapi, scikit-learn, pandas)
python models/train_model.py # Trains initial model
uvicorn api.main:app --reload
```

2. **Start the Frontend Dashboard**:
```bash
cd frontend
npm install
npm run dev
```

### Option B: Docker (Simple)

```bash
docker-compose up --build
```
Access the Live Dashboard at `http://localhost:5173`.