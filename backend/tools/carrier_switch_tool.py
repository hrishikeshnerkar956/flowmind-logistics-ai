import random

def switch_carrier(shipment_id: str, current_carrier: str) -> dict:
    """
    Simulates switching a shipment to a more reliable carrier.
    """
    CARRIERS = ["FastTrack", "SafeTransit", "BlueDart_Mock", "SpeedyLogistics"]
    available = [c for c in CARRIERS if c != current_carrier]
    new_carrier = random.choice(available) if available else current_carrier
    
    return {
        "action": "SWITCH_CARRIER",
        "shipment_id": shipment_id,
        "new_carrier": new_carrier,
        "success": True,
        "message": f"Switched carrier from {current_carrier} to {new_carrier}."
    }
