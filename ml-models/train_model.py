# GreenFleet AI model training script

import json
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

DATASET = Path(__file__).resolve().parent.parent / 'server' / 'data' / 'demo_trips.csv'
MODEL_PATH = Path(__file__).resolve().parent.parent / 'ml-models' / 'fuel_model.pkl'

if __name__ == '__main__':
    df = pd.read_csv(DATASET)
    feature_cols = ['vehicle_type', 'distance_km', 'load_kg', 'avg_speed_kmh', 'traffic_level', 'fuel_efficiency_km_per_litre']
    mapping = {
        'truck': 0,
        'mini_truck': 1,
        'van': 2,
        'tractor': 3,
        'tempo': 4,
        'pickup': 5,
        'ev': 6
    }
    df['vehicle_type'] = df['vehicle_type'].map(mapping).fillna(0)
    traffic = {'low': 1, 'medium': 2, 'high': 3}
    df['traffic_level'] = df['traffic_level'].map(traffic).fillna(2)
    X = df[feature_cols]
    y = df['actual_fuel_litres']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.08,
        objective='reg:squarederror',
        random_state=42,
    )
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    metrics = {
        'mae': float(mean_absolute_error(y_test, pred)),
        'r2': float(r2_score(y_test, pred)),
        'trained_at': __import__('datetime').datetime.utcnow().isoformat(),
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    import pickle
    with MODEL_PATH.open('wb') as fp:
        pickle.dump({'model': model, 'feature_cols': feature_cols, 'metrics': metrics}, fp)
    print(json.dumps(metrics, indent=2))
