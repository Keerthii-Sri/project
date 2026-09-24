# GreenFleet AI

Production-oriented hackathon monorepo for fuel prediction, quantum-inspired fleet optimization, and CO₂ tracking.

## Quick start

1. Create a Supabase project and run `database/schema.sql` in the SQL editor.
2. Copy `.env.example` to `server/.env` and fill in Supabase URL, anon key, service role key, and optionally Gemini key.
3. Run `npm install` in `server` and `client`, then run `npm run dev` in each terminal.
4. Open http://localhost:5173 and sign up. The signup flow creates an organization and admin profile.

The server uses Supabase Auth for JWT verification and the service role only for server-side, organization-scoped queries. Never expose service credentials in the browser.

## Hackathon Demo Steps

1. Sign up as a fleet manager and open **Optimize**.
2. Click **Load demo data & run optimization**. This creates 25 vehicles, 60 Hyderabad-area locations and 600 realistic trips, trains the XGBoost-compatible Python model when available, and runs the optimizer.
3. Review before/after fuel, INR cost, CO₂, AI insights, and colored routes.
4. Open Dashboard and Analytics for trends; use PDF/CSV export from the optimization result.
5. Open Fleet or Locations to demonstrate CRUD and bulk CSV import.

## Architecture

- React 18/Vite/Tailwind/Leaflet/Recharts client.
- Express API with Zod validation, rate limiting, consistent JSON envelopes and Supabase organization isolation.
- Python XGBoost service in `ml-models/train_model.py`; the Node service has a deterministic fallback so demos work without Python.
- OR-Tools-compatible optimization service with capacity, duration and time-window-aware greedy route construction; the objective is quantum-inspired (multi-start assignment and local improvement) and runs on classical hardware.
- Supabase PostgreSQL schema and RLS policies in `database/schema.sql`.

See `docs/API.md` and `docs/DEPLOYMENT.md` for endpoint and deployment details.
