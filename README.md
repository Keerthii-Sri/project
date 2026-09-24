# GreenFleet AI

GreenFleet AI is a production-oriented logistics intelligence platform for Indian SMEs. It predicts trip fuel consumption with an XGBoost-style regressor, schedules vehicles with OR-Tools-inspired optimization, and tracks CO₂ and cost reductions across an organization.

## Features

- Fuel prediction for trip-level fuel consumption
- Quantum-inspired VRP optimization with capacity and duration-aware assignments
- CO₂ and cost tracking using configurable fuel price and CO₂ factors
- CRUD for vehicles and locations with CSV import and map view
- Dashboard, analytics, and route detail pages
- Secure organization-scoped access and demo-ready data seed
- PDF and CSV exports for reports

## Local setup

1. Install dependencies at the repo root:
   npm install
2. Install server and client dependencies:
   npm --prefix server install
   npm --prefix client install
3. Copy `.env.example` to `.env` and set environment values if you want Supabase/Gemini enabled.
4. Start the app:
   npm run dev
5. Open http://localhost:5173

## Supabase setup

1. Create a Supabase project.
2. Run `database/schema.sql` in the Supabase SQL editor.
3. Add auth redirect URL `http://localhost:5173/dashboard`.
4. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the environment.

## Hackathon Demo Steps

1. Sign up or sign in to the app.
2. Go to `/optimize` and click “Load demo data & run optimization”.
3. Watch the optimizer assign routes while the dashboard updates fuel, CO₂, and cost impacts.
4. View route detail pages and analytics to show the improvements.
5. Export the PDF or CSV report for the executive summary.

This flow is designed to be completed in less than 3 minutes.

## Folder structure

- client/ — React + Vite + Tailwind frontend
- server/ — Express backend with services and routes
- database/ — SQL schema and seed scripts
- ml-models/ — training script and model artifact flow
- docs/ — API and deployment notes
