def alert_operator(shipment_id: str, reason: str) -> dict:
    """
    Simulates escalating a high-risk shipment to a human operator.
    """
    return {
        "action": "ALERT",
        "shipment_id": shipment_id,
        "reason": reason,
        "success": True, # For now it always successfully alerts
        "message": f"Human operator alerted. Reason: {reason}"
    }
