# Supabase setup for OMNI AI

This guide moves OMNI's memory records from the Codespace-local SQLite database to a persistent Supabase PostgreSQL database.

## 1. Create a Supabase project

1. Open https://supabase.com/dashboard and create a project.
2. Keep the database password in your password manager. Do not put it in source files, commit it, or send it in chat.
3. Wait for the database to finish provisioning.

## 2. Enable pgvector

In the Supabase project:
1. Open **Database → Extensions**.
2. Search for `vector`.
3. Enable it.

Supabase commonly installs extensions into the `extensions` schema. OMNI's current memory API uses ordinary relational fields and text search; vector embeddings and semantic retrieval are a later feature.

## 3. Copy the correct connection string

1. Click **Connect** in the Supabase project dashboard.
2. Choose **Session pooler**.
3. Copy the PostgreSQL connection string exactly as supplied.
4. Use the session-pooler username, host and port from that string. Do not construct the pooler hostname yourself.
5. The password must be URL-encoded if it contains reserved characters.

For Codespaces, use Session pooler rather than Direct connection: Supabase documents the shared session pooler as IPv4-compatible for persistent backends. OMNI automatically changes a standard `postgresql://` URI to the psycopg 3 SQLAlchemy driver and requires TLS with `sslmode=require`.

## 4. Store the connection string as a Codespaces secret

Do not paste the URI into the terminal, chat, `.env`, frontend code or GitHub files.

1. Open GitHub **Settings → Codespaces**.
2. Find **Codespaces secrets** and select **New secret**.
3. Set the name to `DATABASE_URL`.
4. Paste the Supabase Session pooler connection string as the value.
5. Under repository access, allow `slayxx049/my-ai-agent`.
6. Save the secret.

Official GitHub instructions: https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces

A newly-created secret is injected when a Codespace is created or restarted. Stop the current Codespace and start it again to make the new secret available to its environment.

## 5. Restart OMNI and verify the database target

After restarting the Codespace, open its terminal and run:

```bash
cd /workspaces/my-ai-agent/backend
python -c "import os; print('DATABASE_URL loaded:', bool(os.getenv('DATABASE_URL')))"
```

This prints only whether the variable exists, not its value.

Start OMNI:

```bash
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Open the forwarded port and visit `/api/health`. A successful Supabase connection should include:

```json
{
  "status": "ok",
  "service": "omni-memory-api",
  "database": "connected",
  "database_driver": "postgresql",
  "persistent_storage": true
}
```

If it reports `sqlite` or `persistent_storage: false`, stop. The secret was not injected or the URI was not loaded; do not continue with migration.

## 6. Migrate the existing SQLite memories

Before migrating, verify that the local SQLite file is still present in `backend/omni_memory.db`. This is the file created when OMNI was originally run from the backend directory.

Run:

```bash
cd /workspaces/my-ai-agent/backend
python migrate_sqlite_to_postgres.py
```

The script creates the target table if needed, copies records in batches, and skips IDs that are already present. It does not delete or modify the original SQLite file. It is safe to run again.

If the script says the SQLite file is missing, do not delete any other files. The Supabase schema can still be created, but the old test record will need to be exported from the original Codespace path or entered again manually.

## Security and deployment boundary

The current OMNI API is a single-user development API and does not yet implement Supabase Auth, per-user row-level security, or public API authentication. Keep the Codespaces port private. Do not publish this backend to the open internet until authentication, authorization, per-user data isolation, rate limiting, backups and audit logging are implemented.
