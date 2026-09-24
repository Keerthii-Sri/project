import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

FEATURE_COLS = [
    'vehicle_type',
    'distance_km',
    'load_kg',
    'avg_speed_kmh',
    'traffic_level',
    'fuel_efficiency_km_per_litre',
]

# This example trains a simple XGBoost regressor from generated trip data.
# In a production environment, save actual CSVs into a project share and call this script from CI or deployment tooling.

def main():
    df = pd.DataFrame([
        {'vehicle_type': 'truck', 'distance_km': 90, 'load_kg': 2800, 'avg_speed_kmh': 42, 'traffic_level': 'medium', 'fuel_efficiency_km_per_litre': 6.8, 'actual_fuel_litres': 15.2},
        {'vehicle_type': 'van', 'distance_km': 50, 'load_kg': 1000, 'avg_speed_kmh': 46, 'traffic_level': 'low', 'fuel_efficiency_km_per_litre': 9.1, 'actual_fuel_litres': 6.8},
        {'vehicle_type': 'mini_truck', 'distance_km': 120, 'load_kg': 2100, 'avg_speed_kmh': 35, 'traffic_level': 'high', 'fuel_efficiency_km_per_litre': 8.2, 'actual_fuel_litres': 19.4},
        {'vehicle_type': 'truck', 'distance_km': 70, 'load_kg': 2500, 'avg_speed_kmh': 50, 'traffic_level': 'low', 'fuel_efficiency_km_per_litre': 6.8, 'actual_fuel_litres': 10.8},
    ])

    vehicle_map = {'truck': 0, 'mini_truck': 1, 'van': 2, 'tempo': 3, 'pickup': 4, 'tractor': 5}
    traffic_map = {'low': 1, 'medium': 2, 'high': 3}

    df['vehicle_type'] = df['vehicle_type'].map(vehicle_map)
    df['traffic_level'] = df['traffic_level'].map(traffic_map)

    X = df[FEATURE_COLS]
    y = df['actual_fuel_litres']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    model = XGBRegressor(objective='reg:squarederror', n_estimators=200, max_depth=6, learning_rate=0.08)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    print({
        'mae': round(mean_absolute_error(y_test, pred), 4),
        'r2': round(r2_score(y_test, pred), 4),
        'feature_cols': FEATURE_COLS,
    })

if __name__ == '__main__':
    main()
