from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import pandas as pd
import json
import os
import sys

# Ensure modules can be imported when running from backend root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simulation.shipment_generator import SimulationEngine
from agent.logistics_agent import LogisticsAgent
from agent.memory import AgentMemory

app = FastAPI(title="FlowMind AI Operations Layer")

# Allow React app to fetch data
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sim_engine = SimulationEngine(data_dir="data")
agent = LogisticsAgent(data_dir="data")
is_running = True

async def run_logistics_loop():
    """
    Background worker that runs the continuous operations loop.
    Simulation tick -> Agent tick -> Sleep
    """
    global is_running
    if not os.path.exists(sim_engine.shipments_file):
        sim_engine.generate_initial_data()
        
    while is_running:
        try:
            sim_engine.update_simulation_step()
            agent.run_agent_loop()
        except Exception as e:
            print(f"Error in background loop: {e}")
        # Run every 5 seconds to simulate fast telemetry for demonstration
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_logistics_loop())

@app.on_event("shutdown")
def shutdown_event():
    global is_running
    is_running = False
    agent.memory.close()

@app.get("/")
def health_check():
    return {"status": "FlowMind Operations AI Active"}

@app.get("/api/shipments")
def get_shipments(status: str = "In Transit", limit: int = 50):
    try:
        df = pd.read_csv(sim_engine.shipments_file)
        if status:
            df = df[df["status"] == status]
            
        # Basic heuristic to surface the most "interesting" shipments first for the dashboard
        df["sort_score"] = df["delay_signals"] * 10 + (2000 - df["distance_km"]) / 100
        df = df.sort_values(by="sort_score", ascending=False).drop(columns=["sort_score"])
        
        return df.head(limit).to_dict(orient="records")
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/metrics")
def get_system_metrics():
    try:
        with open(sim_engine.state_file, "r") as f:
            state = json.load(f)
        return state
    except Exception as e:
        return {"error": str(e)}

from pydantic import BaseModel
class ChaosRequest(BaseModel):
    chaos_type: str

@app.post("/api/chaos")
def trigger_chaos(req: ChaosRequest):
    from simulation.inject_chaos import inject_chaos
    try:
        result = inject_chaos(data_dir=sim_engine.data_dir, chaos_type=req.chaos_type)
        return result
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/agent-logs")
def get_agent_decisions(limit: int = 20):
    try:
        # Re-initialize specific read connection to guarantee fresh logs
        memory = AgentMemory(db_path=os.path.join(agent.data_dir, "agent_memory.db"))
        logs = memory.get_recent_decisions(limit=limit)
        return logs
    except Exception as e:
        return {"error": str(e)}
