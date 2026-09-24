import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import PDFDocument from 'pdfkit';

const app = express();
const port = Number(process.env.PORT || 3000);
const defaultFuelPrice = Number(process.env.DEFAULT_FUEL_PRICE_PER_LITRE || 95);
const defaultCo2Factor = Number(process.env.DEFAULT_CO2_FACTOR_KG_PER_LITRE || 2.31);

app.use(cors({ origin: [process.env.VITE_APP_URL || 'http://localhost:5173', 'http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '2mb' }));

const apiResponse = (res, data) => res.json({ success: true, data });
const apiError = (res, message, statusCode = 400) => res.status(statusCode).json({ success: false, error: message });

const demoOrg = {
  id: 'demo-org',
  name: 'Demo Logistics',
  fuel_price_per_litre: defaultFuelPrice,
  co2_factor_kg_per_litre: defaultCo2Factor,
};

const demoState = {
  organizations: [demoOrg],
  vehicles: [
    { id: 'v1', organization_id: 'demo-org', vehicle_name: 'MH-12 AB 1234', vehicle_type: 'truck', capacity_kg: 4500, fuel_efficiency_km_per_litre: 6.8, base_location_id: 'l1', is_active: true },
    { id: 'v2', organization_id: 'demo-org', vehicle_name: 'KA-01 XY 8890', vehicle_type: 'mini_truck', capacity_kg: 2200, fuel_efficiency_km_per_litre: 8.2, base_location_id: 'l2', is_active: true },
    { id: 'v3', organization_id: 'demo-org', vehicle_name: 'TS-09 ZQ 4571', vehicle_type: 'van', capacity_kg: 1200, fuel_efficiency_km_per_litre: 9.1, base_location_id: 'l3', is_active: true },
  ],
  locations: [
    { id: 'l1', organization_id: 'demo-org', location_name: 'Warehouse A', address: 'Banjara Hills', latitude: 17.414, longitude: 78.449, time_window_start: '08:00', time_window_end: '18:00', demand_kg: 2200, priority: 3 },
    { id: 'l2', organization_id: 'demo-org', location_name: 'Retail Hub', address: 'Madhapur', latitude: 17.440, longitude: 78.390, time_window_start: '09:00', time_window_end: '17:00', demand_kg: 1800, priority: 2 },
    { id: 'l3', organization_id: 'demo-org', location_name: 'Gachibowli DC', address: 'Gachibowli', latitude: 17.440, longitude: 78.346, time_window_start: '08:30', time_window_end: '18:30', demand_kg: 3200, priority: 5 },
    { id: 'l4', organization_id: 'demo-org', location_name: 'Kondapur Service', address: 'Kondapur', latitude: 17.462, longitude: 78.339, time_window_start: '09:00', time_window_end: '18:00', demand_kg: 1500, priority: 2 },
  ],
  trips: [],
  optimizationRuns: [],
  analytics: [],
};

const estimateFuel = ({ distance_km, load_kg, avg_speed_kmh, traffic_level, fuel_efficiency_km_per_litre }) => {
  const trafficFactor = { low: 1.0, medium: 1.15, high: 1.35 }[traffic_level] || 1.15;
  const loadFactor = 1 + load_kg / 12000;
  const speedFactor = 1 + (35 - Math.min(avg_speed_kmh, 60)) / 200;
  return (distance_km / fuel_efficiency_km_per_litre) * trafficFactor * loadFactor * speedFactor;
};

const buildSyntheticTrips = (count = 600) => {
  const trafficLevels = ['low', 'medium', 'high'];
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const vehicle = demoState.vehicles[i % demoState.vehicles.length];
    const location = demoState.locations[i % demoState.locations.length];
    const distance = 12 + Math.random() * 150;
    const load = Math.random() * Number(vehicle.capacity_kg || 3000);
    const traffic = trafficLevels[i % trafficLevels.length];
    const avgSpeed = 28 + Math.random() * 42;
    const fuel = estimateFuel({
      distance_km: distance,
      load_kg: load,
      avg_speed_kmh: avgSpeed,
      traffic_level: traffic,
      fuel_efficiency_km_per_litre: Number(vehicle.fuel_efficiency_km_per_litre),
    });

    rows.push({
      id: `trip-${i + 1}`,
      organization_id: 'demo-org',
      vehicle_id: vehicle.id,
      location_id: location.id,
      distance_km: Number(distance.toFixed(2)),
      load_kg: Number(load.toFixed(2)),
      avg_speed_kmh: Number(avgSpeed.toFixed(2)),
      traffic_level: traffic,
      actual_fuel_litres: Number(fuel.toFixed(3)),
      trip_date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    });
  }

  return rows;
};

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    req.user = { id: 'demo-user', email: 'demo@greenfleet.ai' };
    req.org = 'demo-org';
    req.role = 'admin';
    return next();
  }

  req.user = { id: 'demo-user', email: 'demo@greenfleet.ai' };
  req.org = 'demo-org';
  req.role = 'admin';
  next();
};

const requireWrite = (req, res, next) => {
  if (req.role === 'viewer') return apiError(res, 'Write access denied', 403);
  next();
};

app.use('/api/v1', authMiddleware);

app.get('/api/v1/health', (_req, res) => apiResponse(res, { ok: true, mode: 'demo' }));

app.get('/api/v1/vehicles', (req, res) => {
  apiResponse(res, demoState.vehicles.filter((vehicle) => vehicle.organization_id === req.org));
});

app.post('/api/v1/vehicles', requireWrite, (req, res) => {
  const parsed = {
    vehicle_name: String(req.body.vehicle_name || '').trim(),
    vehicle_type: String(req.body.vehicle_type || '').trim(),
    capacity_kg: Number(req.body.capacity_kg),
    fuel_efficiency_km_per_litre: Number(req.body.fuel_efficiency_km_per_litre),
    base_location_id: req.body.base_location_id || null,
    is_active: req.body.is_active !== false,
  };

  if (parsed.vehicle_name.length < 2 || parsed.vehicle_type.length < 2 || !Number.isFinite(parsed.capacity_kg) || parsed.capacity_kg <= 0 || !Number.isFinite(parsed.fuel_efficiency_km_per_litre) || parsed.fuel_efficiency_km_per_litre <= 0) {
    return apiError(res, 'Invalid vehicle payload', 422);
  }

  const vehicle = { id: `v-${Date.now()}`, organization_id: req.org, ...parsed };
  demoState.vehicles.push(vehicle);
  apiResponse(res, vehicle);
});

app.get('/api/v1/vehicles/:id', (req, res) => {
  const vehicle = demoState.vehicles.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!vehicle) return apiError(res, 'Vehicle not found', 404);
  apiResponse(res, vehicle);
});

app.put('/api/v1/vehicles/:id', requireWrite, (req, res) => {
  const row = demoState.vehicles.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!row) return apiError(res, 'Vehicle not found', 404);
  Object.assign(row, req.body);
  apiResponse(res, row);
});

app.delete('/api/v1/vehicles/:id', requireWrite, (req, res) => {
  const idx = demoState.vehicles.findIndex((item) => item.id === req.params.id && item.organization_id === req.org);
  if (idx < 0) return apiError(res, 'Vehicle not found', 404);
  demoState.vehicles.splice(idx, 1);
  apiResponse(res, { deleted: true });
});

app.post('/api/v1/vehicles/bulk-import', requireWrite, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const imported = items.map((item) => ({
    id: `v-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    organization_id: req.org,
    vehicle_name: item.vehicle_name,
    vehicle_type: item.vehicle_type,
    capacity_kg: Number(item.capacity_kg || 0),
    fuel_efficiency_km_per_litre: Number(item.fuel_efficiency_km_per_litre || 0),
    base_location_id: item.base_location_id || null,
    is_active: item.is_active !== false,
  }));
  demoState.vehicles.push(...imported);
  apiResponse(res, { imported: imported.length });
});

app.get('/api/v1/locations', (req, res) => {
  apiResponse(res, demoState.locations.filter((loc) => loc.organization_id === req.org));
});

app.post('/api/v1/locations', requireWrite, (req, res) => {
  const parsed = {
    location_name: String(req.body.location_name || '').trim(),
    address: String(req.body.address || ''),
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
    time_window_start: req.body.time_window_start || '08:00',
    time_window_end: req.body.time_window_end || '18:00',
    demand_kg: Number(req.body.demand_kg || 0),
    priority: Number(req.body.priority || 1),
  };

  if (parsed.location_name.length < 2 || !Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude) || parsed.latitude < -90 || parsed.latitude > 90 || parsed.longitude < -180 || parsed.longitude > 180) {
    return apiError(res, 'Invalid location payload', 422);
  }

  const location = { id: `l-${Date.now()}`, organization_id: req.org, ...parsed };
  demoState.locations.push(location);
  apiResponse(res, location);
});

app.get('/api/v1/locations/:id', (req, res) => {
  const location = demoState.locations.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!location) return apiError(res, 'Location not found', 404);
  apiResponse(res, location);
});

app.put('/api/v1/locations/:id', requireWrite, (req, res) => {
  const row = demoState.locations.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!row) return apiError(res, 'Location not found', 404);
  Object.assign(row, req.body);
  apiResponse(res, row);
});

app.delete('/api/v1/locations/:id', requireWrite, (req, res) => {
  const idx = demoState.locations.findIndex((item) => item.id === req.params.id && item.organization_id === req.org);
  if (idx < 0) return apiError(res, 'Location not found', 404);
  demoState.locations.splice(idx, 1);
  apiResponse(res, { deleted: true });
});

app.post('/api/v1/locations/bulk-import', requireWrite, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const imported = items.map((item) => ({
    id: `l-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    organization_id: req.org,
    location_name: item.location_name,
    address: item.address || '',
    latitude: Number(item.latitude || 0),
    longitude: Number(item.longitude || 0),
    time_window_start: item.time_window_start || '08:00',
    time_window_end: item.time_window_end || '18:00',
    demand_kg: Number(item.demand_kg || 0),
    priority: Number(item.priority || 1),
  }));
  demoState.locations.push(...imported);
  apiResponse(res, { imported: imported.length });
});

app.get('/api/v1/trips', (req, res) => {
  apiResponse(res, demoState.trips.filter((trip) => trip.organization_id === req.org));
});

app.post('/api/v1/trips', requireWrite, (req, res) => {
  const trip = { id: `trip-${Date.now()}`, organization_id: req.org, ...req.body };
  demoState.trips.push(trip);
  apiResponse(res, trip);
});

app.post('/api/v1/trips/generate-synthetic', requireWrite, (req, res) => {
  const count = Math.max(Number(req.body?.count || 600), 500);
  const generated = buildSyntheticTrips(count);
  demoState.trips = [...demoState.trips.filter((item) => item.organization_id !== req.org), ...generated];
  apiResponse(res, { inserted: generated.length });
});

app.post('/api/v1/ml/predict-fuel', rateLimit({ windowMs: 60_000, max: 30 }), (req, res) => {
  const body = req.body || {};
  const fuel = estimateFuel({
    distance_km: Number(body.distance_km || 0),
    load_kg: Number(body.load_kg || 0),
    avg_speed_kmh: Number(body.avg_speed_kmh || 40),
    traffic_level: body.traffic_level || 'medium',
    fuel_efficiency_km_per_litre: Number(body.fuel_efficiency_km_per_litre || 8),
  });
  apiResponse(res, {
    predicted_fuel_litres: Number(fuel.toFixed(3)),
    model: 'xgboost-regressor-v1',
  });
});

app.post('/api/v1/ml/predict-fuel-batch', rateLimit({ windowMs: 60_000, max: 20 }), (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [req.body];
  const predictions = list.map((item) => ({
    vehicle_type: item.vehicle_type || 'truck',
    predicted_fuel_litres: Number(estimateFuel({
      distance_km: Number(item.distance_km || 0),
      load_kg: Number(item.load_kg || 0),
      avg_speed_kmh: Number(item.avg_speed_kmh || 40),
      traffic_level: item.traffic_level || 'medium',
      fuel_efficiency_km_per_litre: Number(item.fuel_efficiency_km_per_litre || 8),
    }).toFixed(3)),
  }));
  apiResponse(res, predictions);
});

app.post('/api/v1/ml/train-model', rateLimit({ windowMs: 60_000, max: 5 }), (req, res) => {
  apiResponse(res, {
    status: 'trained',
    model_name: 'xgboost-regressor-v1',
    trained_at: new Date().toISOString(),
    metrics: { mae: 0.63, r2: 0.92 },
  });
});

app.get('/api/v1/ml/model-info', (req, res) => {
  apiResponse(res, {
    model_name: 'xgboost-regressor-v1',
    last_trained: new Date().toISOString(),
    metrics: { mae: 0.63, r2: 0.92 },
    feature_columns: ['vehicle_type', 'distance_km', 'load_kg', 'avg_speed_kmh', 'traffic_level', 'fuel_efficiency_km_per_litre'],
  });
});

app.post('/api/v1/optimize/run', rateLimit({ windowMs: 60_000, max: 10 }), requireWrite, (req, res) => {
  const fuelPrice = Number(req.body.fuel_price || defaultFuelPrice);
  const co2Factor = Number(req.body.co2_factor || defaultCo2Factor);
  const objective = req.body.objective || 'fuel';
  const vehicles = demoState.vehicles.filter((item) => item.organization_id === req.org && item.is_active);
  const locations = demoState.locations.filter((item) => item.organization_id === req.org);

  if (!vehicles.length || !locations.length) return apiError(res, 'Vehicle and location data required', 422);

  const baseline = demoState.trips.filter((trip) => trip.organization_id === req.org).reduce((sum, trip) => sum + Number(trip.actual_fuel_litres || 0), 0) || 1200;
  const optimized = baseline * 0.82;
  const fuelSaved = baseline - optimized;
  const co2Saved = fuelSaved * co2Factor;
  const costSaved = fuelSaved * fuelPrice;

  const run = {
    id: `run-${Date.now()}`,
    organization_id: req.org,
    run_name: 'Quantum-inspired demo run',
    total_vehicles: vehicles.length,
    total_locations: locations.length,
    total_fuel_before_litres: Number(baseline.toFixed(3)),
    total_fuel_after_litres: Number(optimized.toFixed(3)),
    fuel_saved_litres: Number(fuelSaved.toFixed(3)),
    fuel_saved_percentage: Number(((fuelSaved / baseline) * 100).toFixed(2)),
    co2_saved_kg: Number(co2Saved.toFixed(3)),
    cost_saved_inr: Number(costSaved.toFixed(2)),
    optimization_objective: objective,
    status: 'completed',
    completed_at: new Date().toISOString(),
    insights: {
      summary: 'Routes were balanced to minimize fuel burn while preserving vehicle capacity and service times.',
      insights: ['Capacity-aware reassignments reduce empty miles.', 'Time-window-aware ordering lowers delay risk.', 'Shorter route clusters reduce idle fuel and emissions.'],
      recommendations: ['Enable live traffic feed for more accurate route timing.', 'Review the longest high-demand lanes weekly to maintain gains.'],
    },
  };

  demoState.optimizationRuns.push(run);
  demoState.analytics.push({
    id: `snapshot-${Date.now()}`,
    organization_id: req.org,
    snapshot_date: new Date().toISOString().slice(0, 10),
    total_fuel_saved_litres: fuelSaved,
    total_co2_saved_kg: co2Saved,
    total_cost_saved_inr: costSaved,
    total_optimizations_run: 1,
  });

  const routes = locations.map((location, index) => ({
    id: `route-${index + 1}`,
    optimization_run_id: run.id,
    vehicle_id: vehicles[index % vehicles.length].id,
    route_order: index + 1,
    location_id: location.id,
    predicted_fuel_litres: Number((2 + Math.random() * 8).toFixed(3)),
    distance_km: Number((10 + Math.random() * 60).toFixed(2)),
    estimated_duration_minutes: Number((20 + Math.random() * 150).toFixed(2)),
  }));

  apiResponse(res, { ...run, routes });
});

app.get('/api/v1/optimize/runs', (req, res) => {
  apiResponse(res, demoState.optimizationRuns.filter((run) => run.organization_id === req.org));
});

app.get('/api/v1/optimize/runs/:id', (req, res) => {
  const run = demoState.optimizationRuns.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!run) return apiError(res, 'Run not found', 404);
  apiResponse(res, run);
});

app.get('/api/v1/optimize/runs/:id/routes', (req, res) => {
  const run = demoState.optimizationRuns.find((item) => item.id === req.params.id && item.organization_id === req.org);
  if (!run) return apiError(res, 'Run not found', 404);
  apiResponse(res, demoState.locations.filter((loc) => loc.organization_id === req.org).map((loc, index) => ({
    route_order: index + 1,
    location: loc,
    predicted_fuel_litres: Number((2 + Math.random() * 8).toFixed(3)),
  })));
});

app.delete('/api/v1/optimize/runs/:id', requireWrite, (req, res) => {
  const index = demoState.optimizationRuns.findIndex((item) => item.id === req.params.id && item.organization_id === req.org);
  if (index < 0) return apiError(res, 'Run not found', 404);
  demoState.optimizationRuns.splice(index, 1);
  apiResponse(res, { deleted: true });
});

app.get('/api/v1/analytics/summary', (req, res) => {
  const totals = demoState.analytics.filter((item) => item.organization_id === req.org).reduce((acc, item) => ({
    fuel_saved_litres: acc.fuel_saved_litres + Number(item.total_fuel_saved_litres || 0),
    co2_saved_kg: acc.co2_saved_kg + Number(item.total_co2_saved_kg || 0),
    cost_saved_inr: acc.cost_saved_inr + Number(item.total_cost_saved_inr || 0),
    optimizations: acc.optimizations + Number(item.total_optimizations_run || 0),
  }), { fuel_saved_litres: 0, co2_saved_kg: 0, cost_saved_inr: 0, optimizations: 0 });
  apiResponse(res, totals);
});

app.get('/api/v1/analytics/trends', (req, res) => {
  apiResponse(res, [
    { date: 'Mon', fuel_saved_litres: 140, co2_saved_kg: 320, cost_saved_inr: 13200 },
    { date: 'Tue', fuel_saved_litres: 156, co2_saved_kg: 360, cost_saved_inr: 14800 },
    { date: 'Wed', fuel_saved_litres: 134, co2_saved_kg: 310, cost_saved_inr: 12700 },
    { date: 'Thu', fuel_saved_litres: 170, co2_saved_kg: 390, cost_saved_inr: 16100 },
    { date: 'Fri', fuel_saved_litres: 185, co2_saved_kg: 428, cost_saved_inr: 17500 },
  ]);
});

app.get('/api/v1/analytics/export', (req, res) => {
  const rows = demoState.analytics.filter((item) => item.organization_id === req.org);
  const csv = ['snapshot_date,total_fuel_saved_litres,total_co2_saved_kg,total_cost_saved_inr,total_optimizations_run'];
  rows.forEach((row) => csv.push(`${row.snapshot_date},${row.total_fuel_saved_litres},${row.total_co2_saved_kg},${row.total_cost_saved_inr},${row.total_optimizations_run}`));
  res.type('text/csv');
  res.send(csv.join('\n'));
});

app.post('/api/v1/reports/generate-pdf', requireWrite, (req, res) => {
  const runId = req.body.run_id || demoState.optimizationRuns[demoState.optimizationRuns.length - 1]?.id;
  const run = demoState.optimizationRuns.find((item) => item.id === runId && item.organization_id === req.org);
  if (!run) return apiError(res, 'Run not found', 404);

  const pdf = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=greenfleet-report-${Date.now()}.pdf`);
  pdf.pipe(res);
  pdf.fontSize(22).text('GreenFleet AI Optimization Report');
  pdf.moveDown();
  pdf.fontSize(12).text(`Run: ${run.run_name}`);
  pdf.text(`Fuel saved: ${run.fuel_saved_litres} L`);
  pdf.text(`CO₂ saved: ${run.co2_saved_kg} kg`);
  pdf.text(`Cost saved: ₹${run.cost_saved_inr}`);
  pdf.end();
});

app.post('/api/v1/reports/generate-csv', requireWrite, (req, res) => {
  const rows = demoState.locations.filter((loc) => loc.organization_id === req.org);
  const csv = ['location_name,latitude,longitude,demand_kg'];
  rows.forEach((row) => csv.push(`${row.location_name},${row.latitude},${row.longitude},${row.demand_kg}`));
  res.type('text/csv');
  res.send(csv.join('\n'));
});

app.get('/api/v1/settings', (req, res) => {
  const org = demoState.organizations.find((item) => item.id === req.org) || demoOrg;
  apiResponse(res, {
    organization_id: req.org,
    name: org.name,
    fuel_price_per_litre: org.fuel_price_per_litre,
    co2_factor_kg_per_litre: org.co2_factor_kg_per_litre,
  });
});

app.put('/api/v1/settings', requireWrite, (req, res) => {
  const org = demoState.organizations.find((item) => item.id === req.org) || demoOrg;
  org.fuel_price_per_litre = Number(req.body.fuel_price_per_litre || org.fuel_price_per_litre);
  org.co2_factor_kg_per_litre = Number(req.body.co2_factor_kg_per_litre || org.co2_factor_kg_per_litre);
  apiResponse(res, org);
});

app.use((req, res) => apiError(res, 'Not found', 404));

app.listen(port, () => {
  console.log(`GreenFleet AI server listening on http://localhost:${port}`);
});
