# Deployment notes

For local runs:

- Start the server at `http://localhost:3000`
- Start the client at `http://localhost:5173`
- Use `VITE_APP_URL` to match the frontend host
- Keep the Supabase service role key on the backend only
- Use HTTPS in production and put secrets in environment variables

This app ships with a demo fallback mode so it can run without any external database connection during hackathon demos.
