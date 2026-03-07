import joblib
import os
import pandas as pd

class DelayPredictor:
    def __init__(self, model_path="data/delay_model.pkl"):
        self.model_path = model_path
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self.model = None
            print("Warning: Model file not found. Please run train_model.py first.")

    def predict_risk(self, warehouse_load: float, carrier_reliability: float, distance_km: float, eta_hours: float) -> float:
        """
        Returns the probability (0.0 to 1.0) of a shipment being delayed.
        """
        if self.model is None:
            # Fallback heuristic if model is unavailable
            return min(1.0, (warehouse_load * 0.4) + ((1 - carrier_reliability) * 0.4) + (distance_km / 1500 * 0.2))
            
        features = pd.DataFrame([{
            "warehouse_load": warehouse_load,
            "carrier_reliability": carrier_reliability,
            "distance_km": distance_km,
            "eta_hours": eta_hours
        }])
        
        # predict_proba returns [[prob_not_delayed, prob_delayed]]
        prob = self.model.predict_proba(features)[0][1]
        return float(prob)

    def calculate_shipment_risk_score(self, delay_prob: float, delay_signals: int) -> float:
        """
        Combines ML prediction and operational signals to form a final risk score.
        """
        signal_penalty = min(0.3, delay_signals * 0.1) # Up to +30% risk from raw delay signals
        return min(1.0, delay_prob + signal_penalty)

if __name__ == "__main__":
    predictor = DelayPredictor()
    risk = predictor.predict_risk(
        warehouse_load=0.85, 
        carrier_reliability=0.60, 
        distance_km=1000, 
        eta_hours=20
    )
    print(f"Test Risk Score: {risk:.2f}")
