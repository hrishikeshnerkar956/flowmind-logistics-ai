import pandas as pd
import json
import os
from core.config import settings
from agent.decision_engine import DecisionEngine
from agent.memory import AgentMemory

class LogisticsAgent:
    """
    Implements a full Observe -> Reason -> Decide -> Act -> Learn loop.
    Reads current backend state, runs ML inference, takes actions, and records them.
    """
    def __init__(self):
        self.decision_engine = DecisionEngine()
        self.memory = AgentMemory(db_path=settings.DB_PATH)
        self.shipments_file = settings.SHIPMENTS_PATH
        self.state_file = settings.STATE_PATH
        
    def run_agent_loop(self):
        """
        Main execution loop.
        """
        if not os.path.exists(self.shipments_file) or not os.path.exists(self.state_file):
            print("Simulation data not found. Agent skipping cycle.")
            return

        # ---------------- OBSERVE ----------------
        df_shipments = pd.read_csv(self.shipments_file)
        with open(self.state_file, "r") as f:
            state = json.load(f)
            
        warehouse_load = state["warehouse_load"]
        carrier_reliability = state["carrier_reliability"]
        
        changes_made = False
        
        for idx, row in df_shipments.iterrows():
            if row["status"] in ["Delivered", "Cancelled"]:
                continue
                
            shipment_id = row["shipment_id"]
            carrier = row["carrier"]
            
            # ---------------- REASON & DECIDE ----------------
            decision = self.decision_engine.evaluate_shipment(
                shipment_data=row.to_dict(),
                warehouse_load=warehouse_load.get(row["warehouse"], 0.5),
                carrier_reliability=carrier_reliability.get(carrier, 0.9)
            )
            
            if decision:
                # ---------------- LEARN (Check Past Context) ----------------
                if self.memory.has_recent_action(shipment_id):
                    # Agent learns from memory that it already tried intervening, avoids spam
                    continue 
                    
                # ---------------- ACT ----------------
                action_data = decision["data"]
                
                # Apply simulated actuator change
                if decision["action"] == "REROUTE":
                    df_shipments.at[idx, "distance_km"] = action_data["new_distance_km"]
                elif decision["action"] == "SWITCH_CARRIER":
                    df_shipments.at[idx, "carrier"] = action_data["new_carrier"]
                elif decision["action"] == "PRIORITIZE":
                    df_shipments.at[idx, "priority"] = action_data["new_priority"]
                
                # ---------------- LEARN (Remember Outcome) ----------------
                self.memory.log_decision(
                    shipment_id=shipment_id,
                    risk_score=decision["risk_score"],
                    action_taken=decision["action"],
                    reasoning=decision["reasoning"],
                    details=action_data
                )
                print(f"[AGENT: {decision['action']}] {decision['reasoning']}")
                changes_made = True
                
        if changes_made:
            df_shipments.to_csv(self.shipments_file, index=False)

if __name__ == "__main__":
    agent = LogisticsAgent()
    print("Starting Agentic operations loop...")
    agent.run_agent_loop()
    print("Agent cycle finished.")
