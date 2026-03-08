import pandas as pd
import numpy as np
import random
import uuid
import os
from datetime import datetime, timedelta
import json
from core.config import settings

def load_network_config():
    with open(settings.NETWORK_JSON_PATH, "r") as f:
        data = json.load(f)
    return data["cities"], data["carriers"]

CITIES, CARRIERS = load_network_config()
WAREHOUSES = {city: f"WH_{city}" for city in CITIES}

class SimulationEngine:
    def __init__(self, num_shipments=2000):
        self.num_shipments = num_shipments
        os.makedirs(settings.DATA_DIR, exist_ok=True)
        self.shipments_file = settings.SHIPMENTS_PATH
        self.state_file = settings.STATE_PATH
        self.df = None
        self.warehouse_load = {w: random.uniform(0.4, 0.9) for w in WAREHOUSES.values()}
        self.carrier_reliability = {c: random.uniform(0.7, 0.99) for c in CARRIERS}
        
    def generate_initial_data(self):
        data = []
        for _ in range(self.num_shipments):
            origin = random.choice(CITIES)
            dest = random.choice([c for c in CITIES if c != origin])
            carrier = random.choice(CARRIERS)
            distance = random.randint(200, 1500)
            eta_hours = distance / random.uniform(40, 60) # km/h
            
            data.append({
                "shipment_id": f"S{uuid.uuid4().hex[:8].upper()}",
                "origin": origin,
                "destination": dest,
                "current_location": origin,
                "warehouse": WAREHOUSES[origin],
                "carrier": carrier,
                "distance_km": distance,
                "eta_hours": round(eta_hours, 2),
                "delay_signals": 0,
                "status": "In Transit", 
                "priority": "Standard"
            })
            
        self.df = pd.DataFrame(data)
        self.save_data()
        
    def update_simulation_step(self):
        if self.df is None:
            self.generate_initial_data()
            
        # Fluctuate warehouse loads
        for w in self.warehouse_load:
            if random.random() < 0.05: # sudden congestion spike
                self.warehouse_load[w] = min(1.0, self.warehouse_load[w] + random.uniform(0.2, 0.4))
            else:
                self.warehouse_load[w] = max(0.1, min(1.0, self.warehouse_load[w] + random.uniform(-0.05, 0.05)))
                
        # Fluctuate carrier reliability
        for c in self.carrier_reliability:
            if random.random() < 0.05: # equipment or weather issue
                self.carrier_reliability[c] = max(0.4, self.carrier_reliability[c] - random.uniform(0.1, 0.3))
            else:
                self.carrier_reliability[c] = max(0.1, min(0.99, self.carrier_reliability[c] + random.uniform(-0.02, 0.02)))
                
        # Update shipments
        for idx, row in self.df.iterrows():
            if row["status"] in ["Delivered", "Cancelled"]:
                continue
                
            # Random events affecting ETA
            if random.random() < 0.1:
                self.df.at[idx, "eta_hours"] += random.uniform(0.5, 2.0)
                self.df.at[idx, "delay_signals"] += 1
                
            # Decrease ETA over time (assume 1 simulation step = 1 hour)
            new_eta = max(0, row["eta_hours"] - 1.0)
            self.df.at[idx, "eta_hours"] = round(new_eta, 2)
            
            if new_eta == 0:
                self.df.at[idx, "status"] = "Delivered"
                
        self.save_data()
        
    def save_data(self):
        if self.df is not None:
            self.df.to_csv(self.shipments_file, index=False)
        with open(self.state_file, "w") as f:
            json.dump({
                "warehouse_load": {k: round(v, 2) for k, v in self.warehouse_load.items()},
                "carrier_reliability": {k: round(v, 2) for k, v in self.carrier_reliability.items()},
                "timestamp": datetime.now().isoformat()
            }, f, indent=4)

if __name__ == "__main__":
    engine = SimulationEngine()
    engine.generate_initial_data()
    print(f"Generated {engine.num_shipments} shipments at {engine.shipments_file}")
