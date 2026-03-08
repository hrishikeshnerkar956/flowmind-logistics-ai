import pandas as pd
import numpy as np
import json
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from core.config import settings

def train_delay_model(model_dir="data"):
    shipments_file = settings.SHIPMENTS_PATH
    state_file = settings.STATE_PATH
    model_file = settings.MODEL_PATH
    
    # Load data
    df = pd.read_csv(shipments_file)
    with open(state_file, "r") as f:
        state = json.load(f)
        
    warehouse_load = state["warehouse_load"]
    carrier_reliability = state["carrier_reliability"]
    
    # Map contextual features to the dataset
    df["warehouse_load"] = df["warehouse"].map(warehouse_load)
    df["carrier_reliability"] = df["carrier"].map(carrier_reliability)
    
    # Generate synthetic 'is_delayed' label based on logical heuristics
    # Higher load, lower reliability, and longer distance increases actual delay likelihood
    np.random.seed(42)
    base_risk = (df["warehouse_load"] * 0.4) + ((1 - df["carrier_reliability"]) * 0.4) + (df["distance_km"] / 1500 * 0.2)
    # Add some noise
    risk_with_noise = base_risk + np.random.normal(0, 0.1, len(df))
    df["is_delayed"] = (risk_with_noise > 0.6).astype(int)
    
    features = ["warehouse_load", "carrier_reliability", "distance_km", "eta_hours"]
    X = df[features]
    y = df["is_delayed"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    print(f"Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    
    # Target file
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(clf, model_file)
    print(f"Model saved to {model_file}")

if __name__ == "__main__":
    # Adjust paths since we run from backend root
    train_delay_model(data_dir="data", model_dir="data")
