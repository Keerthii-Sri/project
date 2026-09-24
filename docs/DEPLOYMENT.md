# Deployment

Use Supabase for PostgreSQL/Auth. Run `database/schema.sql` with the SQL editor, configure the service role key only on the server, and deploy the server to a Node 18+ host and client to any static Vite host. Set `VITE_APP_URL` to the exact client origin and configure Supabase Auth redirect URLs to include `/dashboard`. Restrict CORS to that origin. For production, place both services behind HTTPS and use a managed secret store.
