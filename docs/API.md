# API reference

All endpoints are under `/api/v1`, require `Authorization: Bearer <Supabase access token>`, and return `{success,data,error}`.

- `GET/POST/PUT/DELETE /vehicles`, `/locations`
- `POST /trips/generate-synthetic` with `{count}`
- `POST /ml/predict-fuel`
- `POST /optimize/run` with `fuel_price`, `co2_factor`, `max_route_duration_minutes`, `objective`
- `GET /optimize/runs`, `GET /optimize/runs/:id`
- `GET /analytics/summary`
- `GET /settings`, `PUT /settings`
- `POST /reports/generate-pdf` with `{run_id}`
