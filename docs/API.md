# API reference

All endpoints under `/api/v1` return `{ success, data, error }`.

Authentication: `Authorization: Bearer <token>`

Core endpoints:
- `GET /health`
- `GET /vehicles`
- `POST /vehicles`
- `GET /vehicles/:id`
- `PUT /vehicles/:id`
- `DELETE /vehicles/:id`
- `POST /vehicles/bulk-import`
- `GET /locations`
- `POST /locations`
- `GET /locations/:id`
- `PUT /locations/:id`
- `DELETE /locations/:id`
- `POST /locations/bulk-import`
- `GET /trips`
- `POST /trips`
- `POST /trips/generate-synthetic`
- `POST /ml/predict-fuel`
- `POST /ml/predict-fuel-batch`
- `POST /ml/train-model`
- `GET /ml/model-info`
- `POST /optimize/run`
- `GET /optimize/runs`
- `GET /optimize/runs/:id`
- `GET /optimize/runs/:id/routes`
- `DELETE /optimize/runs/:id`
- `GET /analytics/summary`
- `GET /analytics/trends`
- `GET /analytics/export`
- `POST /reports/generate-pdf`
- `POST /reports/generate-csv`
- `GET /settings`
- `PUT /settings`
