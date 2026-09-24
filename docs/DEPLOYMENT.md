# Deployment notes

Use Node 18+, Vite 5+, and a Supabase project for production.

Recommended flow:
- Deploy server to Render, Railway, or a VM.
- Deploy client to Vercel or Netlify.
- Point `VITE_APP_URL` and `CORS` origin to the same frontend domain.
- Store secrets in environment variables and use a managed DB.
- Keep Supabase service-role key on the backend only.

For local testing without a live Supabase project, the server runs in demo mode with in-memory project data so the app remains functional.
