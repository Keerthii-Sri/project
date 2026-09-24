# GreenFleet AI

GreenFleet AI is a demo-ready fleet intelligence platform for Indian logistics SMEs. It predicts trip fuel use, optimizes vehicle-to-route assignments with a quantum-inspired OR-Tools-based routing strategy, and tracks CO₂ and cost savings across an organization.

## Features

- XGBoost-style fuel prediction engine for trip-level estimates
- Quantum-inspired VRP optimization for route assignment
- Real-time CO₂ and cost calculators with configurable fuel price and emissions factor
- CRUD for fleet and locations with CSV bulk import support
- Interactive route and analytics views
- Org-scoped auth and role model
- PDF and CSV report generation

## Local setup

1. Install root dependencies:
   npm install
2. Install frontend and backend dependencies:
   npm --prefix client install
   npm --prefix server install
3. Copy `.env.example` to a local `.env` and update values.
4. Run the app:
   npm run dev
5. Visit http://localhost:5173

## Environment setup

Set environment variables in a `.env` file at the repo root or in `server/.env` depending on deployment. The example file is:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `NODE_ENV`
- `PORT`
- `VITE_APP_URL`
- `DEFAULT_FUEL_PRICE_PER_LITRE`
- `DEFAULT_CO2_FACTOR_KG_PER_LITRE`
- `JWT_SECRET`

## Hackathon Demo Steps

1. Open the app and sign up or log in.
2. Go to the Optimize page and choose the demo flow.
3. Click “Load demo data & run optimization”.
4. Review the dashboard, route details, and analytics for savings and emissions reduction.
5. Export the report as CSV or PDF.

This flow is designed to run in under 3 minutes without any manual database editing.

## Project structure

- `client/` — Vite + React frontend
- `server/` — Express API and services
- `database/` — PostgreSQL schema and seed SQL
- `ml-models/` — XGBoost training script and model artifact placeholder
- `docs/` — API and deployment notes
