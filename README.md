
  # SaaS Escolar Diário Escolar

  This is a code bundle for SaaS Escolar Diário Escolar. The original project is available at https://www.figma.com/design/9RQVQqEwwsFpppc7lVtoH9/SaaS-Escolar-Di%C3%A1rio-Escolar.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Local Database With Docker Compose

  If you want a lightweight local database without touching production, use Docker Compose.

  Short version:

  - `npm run services:up`
  - `npm run services:status`
  - `npm run services:stop`
  - `npm run services:down`

  1. Start Docker Desktop.
  2. Run `npm run services:up`.
  3. Connect to `postgresql://postgres:postgres@127.0.0.1:5432/diarioescolar_local`, unless you override the defaults in `.env`.
  4. Use `npm run services:status` to inspect the container.
  5. Use `npm run services:stop` or `npm run services:down` when finished.

  Notes:

  - The compose file lives in `infra/compose.yaml`.
  - The database service uses `postgres:16.0-alpine3.18`.
  - Docker reads `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT` from `.env` when you define them there.
  - On Windows, `npm run services:up` now tries to open Docker Desktop automatically and waits for the engine before running `docker compose`.
  - If Windows shows an error mentioning `//./pipe/docker_engine`, open Docker Desktop and wait for the engine to finish starting before running `npm run services:up` again.
  - This flow is ideal for testing SQL and a local Postgres safely, but it does not replace Supabase Auth, Storage, or Edge Functions.

  ## Local Supabase Stack

  If you want the full local Supabase environment with Auth, Studio, and Edge Functions, use:

  - `npm run supabase:start`
  - `npm run supabase:env:write`
  - `npm run supabase:reset`
  - `npm run dev`

  Notes:

  - `.env.local` overrides `.env`, so you can point the frontend to local Supabase without changing your production settings.
  - The local Supabase Studio usually opens at `http://127.0.0.1:54323`.
  - The local API usually runs at `http://127.0.0.1:54321`.
  - To stop the local Supabase stack, run `npm run supabase:stop`.
  - To create a local platform admin, create a user in local `Authentication > Users`, then use the SQL from `supabase/README.md` against the local stack.

  ## Database

  The repository now includes an initial Supabase migration for a multi-school setup in `supabase/migrations`.

  See `supabase/README.md` for the steps to link the repository to your Supabase project and apply the schema.
  
