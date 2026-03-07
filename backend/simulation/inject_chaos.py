import json
import os
import random
from datetime import datetime

def inject_chaos(data_dir="data", chaos_type="warehouse_congestion"):
    """
    Manually overrides the system state to simulate severe network events.
    Types: 
        - 'warehouse_congestion': Maxes out random warehouses.
        - 'carrier_failure': Drops a major carrier's reliability to < 40%.
    """
    state_file = os.path.join(data_dir, "system_state.json")
    
    if not os.path.exists(state_file):
        return {"error": "Simulation not running"}
        
    with open(state_file, "r") as f:
        state = json.load(f)
        
    chaos_event = ""
    
    if chaos_type == "warehouse_congestion":
        target = random.choice(list(state["warehouse_load"].keys()))
        state["warehouse_load"][target] = 0.99
        chaos_event = f"Severe congestion spiked at {target} (99% load)."
        
    elif chaos_type == "carrier_failure":
        target = random.choice(list(state["carrier_reliability"].keys()))
        state["carrier_reliability"][target] = 0.35
        chaos_event = f"Carrier '{target}' experiencing catastrophic delays (35% reliability)."
        
    state["timestamp"] = datetime.now().isoformat()
    state["last_chaos_event"] = chaos_event
    
    with open(state_file, "w") as f:
        json.dump(state, f, indent=4)
        
    return {"status": "Chaos Injected", "event": chaos_event}

if __name__ == "__main__":
    # Test
    print(inject_chaos(data_dir="../data", chaos_type="warehouse_congestion"))
