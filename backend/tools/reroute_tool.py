import random

def reroute_shipment(shipment_id: str, current_distance: float) -> dict:
    """
    Simulates rerouting a shipment to avoid congestion.
    """
    # Reduce distance randomly by 10% to 30% due to better path finding
    reduction = random.uniform(0.1, 0.3)
    new_distance = max(10, int(current_distance * (1 - reduction)))
    return {
        "action": "REROUTE",
        "shipment_id": shipment_id,
        "new_distance_km": new_distance,
        "success": True,
        "message": f"Successfully rerouted. Distance reduced to {new_distance}km."
    }
