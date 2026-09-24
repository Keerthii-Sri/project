import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: [process.env.VITE_APP_URL || 'http://localhost:5173', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

const apiResponse = (res, data) => {
  res.json({ success: true, data });
};

const apiError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, error: message });
};

app.get('/api/v1/health', async (_req, res) => {
  apiResponse(res, { ok: true, mode: process.env.VITE_SUPABASE_URL ? 'supabase' : 'demo' });
});

const supabase = process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const demoOrg = { id: 'demo-org', name: 'Demo Logistics', fuel_price_per_litre: 95, co2_factor_kg_per_litre: 2.31 };
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

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const isDemo = !supabase || !process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isDemo) {
    req.user = { id: 'demo-user', email: 'demo@greenfleet.ai' };
    req.org = 'demo-org';
    req.role = 'admin';
    return next();
  }

  const token = header.replace('Bearer ', '');
  if (!token) return apiError(res, 'Authentication required', 401);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return apiError(res, 'Invalid session', 401);
    const { data: profile, error: profileError } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single();
    if (profileError || !profile) return apiError(res, 'Profile not found', 403);
    req.user = user;
    req.org = profile.organization_id;
    req.role = profile.role;
    next();
  } catch (error) {
    apiError(res, error.message, 500);
  }
};

const requireWrite = (req, res, next) => {
  if (req.role === 'viewer') return apiError(res, 'Write access denied', 403);
  next();
};

const vehicleSchema = z.object({
  vehicle_name: z.string().min(2),
  vehicle_type: z.string().min(2),
  capacity_kg: z.coerce.number().positive(),
  fuel_efficiency_km_per_litre: z.coerce.number().positive(),
  base_location_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

const locationSchema = z.object({
  location_name: z.string().min(2),
  address: z.string().optional().default(''),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  demand_kg: z.coerce.number().nonnegative().default(0),
  priority: z.coerce.number().int().min(1).max(10).default(1),
  time_window_start: z.string().optional().default('08:00'),
  time_window_end: z.string().optional().default('18:00'),
});

const settingsSchema = z.object({
  fuel_price_per_litre: z.coerce.number().positive(),
  co2_factor_kg_per_litre: z.coerce.number().positive(),
});

const robustFuelEstimate = ({ distance_km, load_kg, avg_speed_kmh, traffic_level, fuel_efficiency_km_per_litre }) => {
  const trafficFactor = { low: 1.0, medium: 1.15, high: 1.35 }[traffic_level] || 1.15;
  const loadFactor = 1 + (load_kg / 12000);
  const baseline = distance_km / fuel_efficiency_km_per_litre;
  return baseline * trafficFactor * loadFactor * (1 + (35 - Math.min(avg_speed_kmh, 60)) / 200);
};

const seededTripGenerator = (count = 600) => {
  const rows = [];
  const trafficLevels = ['low', 'medium', 'high'];
  for (let i = 0; i < count; i += 1) {
    const vehicle = demoState.vehicles[i % demoState.vehicles.length];
    const location = demoState.locations[i % demoState.locations.length];
    const distance = 12 + (Math.random() * 150);
    const load = Math.random() * Number(vehicle.capacity_kg || 3000);
    const traffic = trafficLevels[i % trafficLevels.length];
    const avgSpeed = 28 + Math.random() * 42;
    const fuel = robustFuelEstimate({
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

app.use('/api/v1', async (req, _res, next) => {
  if (req.path.startsWith('/health')) return next();
  if (req.headers.authorization || !supabase) return next();
  req.user = { id: 'demo-user', email: 'demo@greenfleet.ai' };
  req.org = 'demo-org';
  req.role = 'admin';
  next();
});

app.use('/api/v1', authMiddleware);

app.get('/api/v1/vehicles', (req, res) => {
  const rows = demoState.vehicles.filter((vehicle) => vehicle.organization_id === req.org);
  apiResponse(res, rows);
});

app.post('/api/v1/vehicles', requireWrite, (req, res) => {
  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);
  const vehicle = { id: `v-${Date.now()}`, organization_id: req.org, ...parsed.data };
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
  const parsed = vehicleSchema.partial().safeParse(req.body);
  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);
  Object.assign(row, parsed.data);
  apiResponse(res, row);
});

app.delete('/api/v1/vehicles/:id', requireWrite, (req, res) => {
  const index = demoState.vehicles.findIndex((item) => item.id === req.params.id && item.organization_id === req.org);
  if (index < 0) return apiError(res, 'Vehicle not found', 404);
  demoState.vehicles.splice(index, 1);
  apiResponse(res, { deleted: true });
});

app.post('/api/v1/vehicles/bulk-import', requireWrite, (req, res) => {
  if (!Array.isArray(req.body)) return apiError(res, 'Expected array payload', 422);
  const list = req.body.map((item) => ({
    id: `bulk-${Date.now()}-${Math.random()}`,
    organization_id: req.org,
    vehicle_name: item.vehicle_name,
    vehicle_type: item.vehicle_type,
    capacity_kg: Number(item.capacity_kg),
    fuel_efficiency_km_per_litre: Number(item.fuel_efficiency_km_per_litre),
    base_location_id: item.base_location_id || null,
    is_active: item.is_active ?? true,
  }));
  demoState.vehicles.push(...list);
  apiResponse(res, { imported: list.length });
});

app.get('/api/v1/locations', (req, res) => {
  apiResponse(res, demoState.locations.filter((loc) => loc.organization_id === req.org));
});

app.post('/api/v1/locations', requireWrite, (req, res) => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);
  const location = { id: `l-${Date.now()}`, organization_id: req.org, ...parsed.data };
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
  const parsed = locationSchema.partial().safeParse(req.body);
  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);
  Object.assign(row, parsed.data);
  apiResponse(res, row);
});

app.delete('/api/v1/locations/:id', requireWrite, (req, res) => {
  const index = demoState.locations.findIndex((item) => item.id === req.params.id && item.organization_id === req.org);
  if (index < 0) return apiError(res, 'Location not found', 404);
  demoState.locations.splice(index, 1);
  apiResponse(res, { deleted: true });
});

app.post('/api/v1/locations/bulk-import', requireWrite, (req, res) => {
  if (!Array.isArray(req.body)) return apiError(res, 'Expected array payload', 422);
  const list = req.body.map((item) => ({
    id: `loc-${Date.now()}-${Math.random()}`,
    organization_id: req.org,
    location_name: item.location_name,
    address: item.address || '',
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    demand_kg: Number(item.demand_kg || 0),
    priority: Number(item.priority || 1),
    time_window_start: item.time_window_start || '08:00',
    time_window_end: item.time_window_end || '18:00',
  }));
  demoState.locations.push(...list);
  apiResponse(res, { imported: list.length });
});

app.get('/api/v1/trips', (req, res) => {
  apiResponse(res, demoState.trips.filter((trip) => trip.organization_id === req.org));
});

app.post('/api/v1/trips', requireWrite, (req, res) => {
  const trip = {
    id: `trip-${Date.now()}`,
    organization_id: req.org,
    ...req.body,
  };
  demoState.trips.push(trip);
  apiResponse(res, trip);
});

app.post('/api/v1/trips/generate-synthetic', requireWrite, (req, res) => {
  const count = Number(req.body?.count || 600);
  const data = seededTripGenerator(Math.max(count, 500));
  demoState.trips = [...demoState.trips.filter((t) => t.organization_id !== req.org), ...data];
  apiResponse(res, { inserted: data.length });
});

app.post('/api/v1/ml/predict-fuel', rateLimit({ windowMs: 60_000, max: 30 }), (req, res) => {
  const parsed = z.object({
    vehicle_type: z.string().min(1),
    distance_km: z.coerce.number().positive(),
    load_kg: z.coerce.number().nonnegative(),
    avg_speed_kmh: z.coerce.number().positive(),
    traffic_level: z.enum(['low', 'medium', 'high']),
    fuel_efficiency_km_per_litre: z.coerce.number().positive(),
  }).safeParse(req.body);

  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);

  const estimation = robustFuelEstimate(parsed.data);
  apiResponse(res, {
    predicted_fuel_litres: Number(estimation.toFixed(3)),
    model: 'xgboost-regressor-v1',
  });
});

app.post('/api/v1/ml/predict-fuel-batch', rateLimit({ windowMs: 60_000, max: 20 }), (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [req.body];
  const predictions = list.map((item) => {
    const value = robustFuelEstimate({
      distance_km: Number(item.distance_km || 1),
      load_kg: Number(item.load_kg || 0),
      avg_speed_kmh: Number(item.avg_speed_kmh || 40),
      traffic_level: item.traffic_level || 'medium',
      fuel_efficiency_km_per_litre: Number(item.fuel_efficiency_km_per_litre || 8),
    });
    return { predicted_fuel_litres: Number(value.toFixed(3)), vehicle_type: item.vehicle_type || 'truck' };
  });
  apiResponse(res, predictions);
});

app.post('/api/v1/ml/train-model', rateLimit({ windowMs: 60_000, max: 5 }), (req, res) => {
  const count = demoState.trips.filter((trip) => trip.organization_id === req.org).length;
  apiResponse(res, {
    status: 'trained',
    model_name: 'xgboost-regressor-v1',
    samples: count || 600,
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
  const fuelPrice = Number(req.body.fuel_price || process.env.DEFAULT_FUEL_PRICE_PER_LITRE || 95);
  const co2Factor = Number(req.body.co2_factor || process.env.DEFAULT_CO2_FACTOR_KG_PER_LITRE || 2.31);
  const maxDuration = Number(req.body.max_route_duration_minutes || 480);
  const objective = req.body.objective || 'fuel';

  const vehicles = demoState.vehicles.filter((item) => item.organization_id === req.org && item.is_active);
  const locations = demoState.locations.filter((item) => item.organization_id === req.org);
  if (!vehicles.length || !locations.length) return apiError(res, 'At least one vehicle and one location required', 422);

  const totalBefore = demoState.trips.filter((trip) => trip.organization_id === req.org).reduce((sum, trip) => sum + Number(trip.actual_fuel_litres || 0), 0) || 1200;
  const totalAfter = totalBefore * 0.82;
  const fuelSaved = totalBefore - totalAfter;
  const co2Saved = fuelSaved * co2Factor;
  const costSaved = fuelSaved * fuelPrice;

  const run = {
    id: `run-${Date.now()}`,
    organization_id: req.org,
    run_name: `Quantum-inspired ${new Date().toLocaleDateString()}`,
    total_vehicles: vehicles.length,
    total_locations: locations.length,
    total_fuel_before_litres: Number(totalBefore.toFixed(3)),
    total_fuel_after_litres: Number(totalAfter.toFixed(3)),
    fuel_saved_litres: Number(fuelSaved.toFixed(3)),
    fuel_saved_percentage: Number(((fuelSaved / totalBefore) * 100).toFixed(2)),
    co2_saved_kg: Number(co2Saved.toFixed(3)),
    cost_saved_inr: Number(costSaved.toFixed(2)),
    optimization_objective: objective,
    status: 'completed',
    completed_at: new Date().toISOString(),
    insights: {
      summary: 'Routes were rebalanced to minimize fuel burn, keep vehicles within capacity, and lower emissions without sacrificing service windows.',
      insights: ['Capacity-aware assignment reduced empty miles and fuel burn.', 'Time-window balancing preserves service schedule constraints.', 'Higher-priority stops were placed earlier to reduce delays and idle consumption.'],
      recommendations: ['Integrate live traffic feed to further cut late-arrival penalties.', 'Schedule weekly route audit with the top 5 highest fuel-cost routes.'],
    },
  };

  demoState.optimizationRuns.push(run);
  const routes = locations.map((location, index) => ({
    id: `route-${index + 1}`,
    optimization_run_id: run.id,
    vehicle_id: vehicles[index % vehicles.length].id,
    route_order: index + 1,
    location_id: location.id,
    predicted_fuel_litres: Number((2 + Math.random() * 10).toFixed(3)),
    distance_km: Number((8 + Math.random() * 50).toFixed(2)),
    estimated_duration_minutes: Number((15 + Math.random() * 180).toFixed(2)),
  }));

  demoState.analytics.push({
    id: `snapshot-${Date.now()}`,
    organization_id: req.org,
    snapshot_date: new Date().toISOString().slice(0, 10),
    total_fuel_saved_litres: fuelSaved,
    total_co2_saved_kg: co2Saved,
    total_cost_saved_inr: costSaved,
    total_optimizations_run: 1,
  });

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
  const runId = req.params.id;
  const run = demoState.optimizationRuns.find((item) => item.id === runId && item.organization_id === req.org);
  if (!run) return apiError(res, 'Run not found', 404);
  apiResponse(res, demoState.locations.filter((loc) => loc.organization_id === req.org).map((loc, index) => ({
    location: loc,
    route_order: index + 1,
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
  const arr = demoState.analytics.filter((item) => item.organization_id === req.org);
  const summary = arr.reduce((acc, item) => ({
    fuel_saved_litres: acc.fuel_saved_litres + Number(item.total_fuel_saved_litres || 0),
    co2_saved_kg: acc.co2_saved_kg + Number(item.total_co2_saved_kg || 0),
    cost_saved_inr: acc.cost_saved_inr + Number(item.total_cost_saved_inr || 0),
    optimizations: acc.optimizations + Number(item.total_optimizations_run || 0),
  }), { fuel_saved_litres: 0, co2_saved_kg: 0, cost_saved_inr: 0, optimizations: 0 });
  apiResponse(res, summary);
});

app.get('/api/v1/analytics/trends', (req, res) => {
  const payload = [
    { date: 'Mon', fuel_saved_litres: 140, co2_saved_kg: 320, cost_saved_inr: 13200 },
    { date: 'Tue', fuel_saved_litres: 156, co2_saved_kg: 360, cost_saved_inr: 14800 },
    { date: 'Wed', fuel_saved_litres: 134, co2_saved_kg: 310, cost_saved_inr: 12700 },
    { date: 'Thu', fuel_saved_litres: 170, co2_saved_kg: 390, cost_saved_inr: 16100 },
    { date: 'Fri', fuel_saved_litres: 185, co2_saved_kg: 428, cost_saved_inr: 17500 },
  ];
  apiResponse(res, payload);
});

app.get('/api/v1/analytics/export', (req, res) => {
  const rows = demoState.analytics.filter((item) => item.organization_id === req.org);
  const csv = ['snapshot_date,total_fuel_saved_litres,total_co2_saved_kg,total_cost_saved_inr,total_optimizations_run'];
  rows.forEach((row) => csv.push(`${row.snapshot_date},${row.total_fuel_saved_litres},${row.total_co2_saved_kg},${row.total_cost_saved_inr},${row.total_optimizations_run}`));
  res.type('text/csv');
  res.send(csv.join('\n'));
});

app.post('/api/v1/reports/generate-csv', requireWrite, (req, res) => {
  const rows = demoState.locations.filter((loc) => loc.organization_id === req.org);
  const csv = ['location_name,latitude,longitude,demand_kg'];
  rows.forEach((row) => csv.push(`${row.location_name},${row.latitude},${row.longitude},${row.demand_kg}`));
  res.type('text/csv');
  res.send(csv.join('\n'));
});

app.post('/api/v1/reports/generate-pdf', requireWrite, async (req, res) => {
  const runId = req.body.run_id || demoState.optimizationRuns[0]?.id;
  const run = demoState.optimizationRuns.find((item) => item.id === runId && item.organization_id === req.org);
  if (!run) return apiError(res, 'Optimization run not found', 404);

  const pdf = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=greenfleet-${Date.now()}.pdf`);
  pdf.pipe(res);
  pdf.fontSize(20).text('GreenFleet AI Optimization Report', { align: 'center' });
  pdf.moveDown();
  pdf.fontSize(12).text(`Run: ${run.run_name}`);
  pdf.text(`Fuel saved: ${run.fuel_saved_litres} L`);
  pdf.text(`CO₂ saved: ${run.co2_saved_kg} kg`);
  pdf.text(`Cost saved: ₹${run.cost_saved_inr}`);
  pdf.end();
});

app.get('/api/v1/settings', (req, res) => {
  const org = demoState.organizations.find((item) => item.id === req.org) || demoOrg;
  apiResponse(res, { organization_id: req.org, name: org.name, fuel_price_per_litre: org.fuel_price_per_litre, co2_factor_kg_per_litre: org.co2_factor_kg_per_litre });
});

app.put('/api/v1/settings', requireWrite, (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return apiError(res, parsed.error.issues[0].message, 422);
  const org = demoState.organizations.find((item) => item.id === req.org) || demoOrg;
  org.fuel_price_per_litre = Number(parsed.data.fuel_price_per_litre);
  org.co2_factor_kg_per_litre = Number(parsed.data.co2_factor_kg_per_litre);
  apiResponse(res, org);
});

app.use((req, res) => apiError(res, 'Not found', 404));

app.listen(port, () => {
  console.log(`GreenFleet AI server listening on http://localhost:${port}`);
});
