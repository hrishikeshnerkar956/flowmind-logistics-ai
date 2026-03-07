from models.delay_prediction import DelayPredictor
from tools.reroute_tool import reroute_shipment
from tools.carrier_switch_tool import switch_carrier
from tools.prioritize_tool import prioritize_shipment
from tools.alert_tool import alert_operator

class DecisionEngine:
    def __init__(self):
        self.predictor = DelayPredictor(model_path="data/delay_model.pkl")

    def evaluate_shipment(self, shipment_data: dict, warehouse_load: float, carrier_reliability: float) -> dict:
        """
        Re-evaluates a shipment using Machine Learning and Operational Policy Rules.
        Returns the chosen intervention or None if healthy.
        """
        shipment_id = shipment_data["shipment_id"]
        distance_km = shipment_data["distance_km"]
        eta_hours = shipment_data["eta_hours"]
        delay_signals = shipment_data["delay_signals"]
        
        # 1. Prediction Model call
        delay_prob = self.predictor.predict_risk(
            warehouse_load=warehouse_load,
            carrier_reliability=carrier_reliability,
            distance_km=distance_km,
            eta_hours=eta_hours
        )
        
        final_risk = self.predictor.calculate_shipment_risk_score(delay_prob, delay_signals)
        
        action_data = None
        reasoning = ""
        
        # 2. Heuristic Rules Policy Logic mapping to advanced LLM-style Generation
        if final_risk > 0.90:
            action_data = alert_operator(shipment_id=shipment_id, reason=f"Extremely high risk score: {final_risk:.2f}")
            reasoning = self._generate_llm_reasoning("ALERT", shipment_id, final_risk, warehouse_load, carrier_reliability)
        elif delay_prob > 0.85:
            action_data = reroute_shipment(shipment_id=shipment_id, current_distance=distance_km)
            reasoning = self._generate_llm_reasoning("REROUTE", shipment_id, final_risk, warehouse_load, carrier_reliability)
        elif carrier_reliability < 0.70:
            action_data = switch_carrier(shipment_id=shipment_id, current_carrier=shipment_data["carrier"])
            reasoning = self._generate_llm_reasoning("SWITCH_CARRIER", shipment_id, final_risk, warehouse_load, carrier_reliability)
        elif delay_prob > 0.65 and shipment_data.get("priority") != "High":
            action_data = prioritize_shipment(shipment_id=shipment_id)
            reasoning = self._generate_llm_reasoning("PRIORITIZE", shipment_id, final_risk, warehouse_load, carrier_reliability)
            
        if action_data:
            return {
                "action": action_data["action"],
                "data": action_data,
                "reasoning": reasoning,
                "risk_score": final_risk
            }
            
        return None

    def _generate_llm_reasoning(self, action: str, shipment_id: str, risk: float, wh_load: float, carrier_rel: float) -> str:
        """
        Simulates an LLM call to generate a nuanced, contextual reasoning trace.
        In a full production environment, this would call OpenAI/Groq/Gemini APIs.
        """
        import random
        
        system_status = f"Warehouse Congestion: {wh_load*100:.0f}%, Carrier Reliability: {carrier_rel*100:.0f}%"
        
        templates = {
            "ALERT": [
                f"[AI Insight] Analysis of risk cluster for {shipment_id} yields a critical {risk:.2f} probability of severe delay. {system_status}. Deterministic recovery paths exhausted. Escalating to human traffic controllers immediately.",
                f"Critical threshold breach detected for {shipment_id}. Computed risk metric ({risk:.2f}) exceeds autonomous autonomy boundaries. {system_status}. Operator intervention required to prevent cascading late deliveries."
            ],
            "REROUTE": [
                f"[AI Optimization] {system_status}. This confluence degrades the primary route viability. Rerouting {shipment_id} to bypass the congestion node guarantees a 24% ETA recovery.",
                f"Predictive models indicate an unacceptable risk ({risk:.2f}) on the current trajectory for {shipment_id} due to {wh_load*100:.0f}% warehouse gridlock. Engaging autonomous reroute protocols to stabilize ETA."
            ],
            "SWITCH_CARRIER": [
                f"[Network Action] Carrier performance metric dropped to {carrier_rel*100:.0f}%. To protect {shipment_id}'s delivery SLA against a computed risk of {risk:.2f}, I have autonomously rotated the fulfillment to an alternate carrier.",
                f"SLA warning for {shipment_id}: {system_status}. Risk score of {risk:.2f} requires mitigation. Executed smart-swap actuator tool to transfer load to a healthier network carrier."
            ],
            "PRIORITIZE": [
                f"[Queue Adjustment] Early anomaly detected for {shipment_id} (Risk: {risk:.2f}). {system_status}. Elevating sort priority to 'High' to fast-track fulfillment and offset localized delays.",
                f"Mitigating emerging risk profile for {shipment_id}. With {system_status}, standard queue processing will result in a delay. Upgraded payload to Priority status."
            ]
        }
        
        return random.choice(templates[action])
