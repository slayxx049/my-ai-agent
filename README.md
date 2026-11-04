# OMNI AI

**A unified web control centre for AI models, agents, and workflows.**

OMNI AI is being developed as a browser-based workspace where you can connect model providers, configure specialist agents, coordinate multi-agent tasks, and inspect execution history.

## Project status

The current release is **Phase 1: frontend foundation**.

- Responsive dashboard and navigation
- Model-provider catalogue (connection states are placeholders)
- Agent catalogue and workflow overview
- Local task-queue interaction for testing the interface
- No API keys or credentials are stored in the browser

The task composer currently creates a **local preview item only**. It does not call an AI model yet.

## Planned architecture

| Layer | Planned technology |
|---|---|
| Web interface | HTML, CSS, JavaScript |
| API backend | Python + FastAPI |
| Model gateway | LiteLLM |
| Agent orchestration | OMNI supervisor + agent adapters |
| Tool integrations | MCP |
| Agent-to-agent interoperability | A2A |
| Initial persistence | SQLite |

Model and agent integrations will be implemented server-side. **Never put provider API keys in frontend JavaScript or commit them to this repository.**

## Run locally

Open `index.html` in a browser, or serve the project with a local static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Open this repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose branch **main** and folder **/(root)**, then save.
5. Open the Pages URL shown on that settings screen after deployment finishes.

GitHub Pages hosts the static frontend. The future FastAPI backend will need a separate server/hosting environment.

## Roadmap

- [x] Establish the frontend repository
- [x] Build the initial dashboard shell
- [ ] Add backend API service
- [ ] Connect the first model provider
- [ ] Add provider/model management
- [ ] Implement agent creation and configuration
- [ ] Add supervisor-based multi-agent runs
- [ ] Add MCP tool integrations
- [ ] Add task history, memory, and permissions
- [ ] Deploy the backend and connect it to the website

## Security baseline

- Keep secrets in backend environment variables or a secrets manager.
- Do not expose API keys to browser code.
- Require explicit approval for consequential tool actions.
- Treat external model/tool output as untrusted input.
- Add authentication before exposing the backend publicly.

## License

No license has been added yet. All rights remain with the repository owner unless a license is added.


## Run the memory backend locally (Windows)

GitHub Pages serves only the static website. Run the Python API locally for the first memory test.

1. Install Python 3.11 or newer.
2. Open PowerShell in the repository folder and run:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

The first run creates a local SQLite database file in the backend folder. Keep this terminal open.

3. Open a second PowerShell window in the repository root and run:

```powershell
py -m http.server 5500
```

4. Visit `http://127.0.0.1:5500` and select **Memory Studio**.

This starter API has no user authentication and is intended for local development only. Do not expose it to the public internet or bind it to `0.0.0.0`. Before public deployment, add authentication, per-user data isolation, rate limiting, TLS and backups.

## Optional PostgreSQL + pgvector

Docker Compose is included for the later PostgreSQL setup. Copy `.env.example` to `.env`, replace the sample password, then start the database with `docker compose up -d`. Configure `DATABASE_URL` in `.env` and run the API from the backend folder. SQLite is simplest for the first test and needs no Docker.


## Run OMNI in a browser with GitHub Codespaces

1. Open this repository on GitHub.
2. Select **Code → Codespaces → Create codespace on main**.
3. Wait for the browser editor to finish preparing the environment.
4. In its terminal, run:

```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000
```

5. Open the **Ports** panel. Open port `8000` in the browser. Keep its visibility **Private** while testing.
6. The dashboard and memory API are served from the same forwarded URL. The initial SQLite database is created under `backend/`.

The repository includes a lightweight dev-container setup that forwards port 8000 without installing dependencies during container creation. After the editor opens, install the Python dependencies manually with `pip install -r backend/requirements.txt` from the repository root.

### Codespaces limitations

Codespaces is for development and previews. Its compute stops when the codespace stops or times out, so the app is not continuously available. Personal GitHub Free accounts currently include 120 core-hours and 15 GB-month of Codespaces storage; check your account's usage page before creating or resizing a machine. <https://docs.github.com/en/billing/reference/product-usage-included>

For a public always-on app, deploy the frontend, API and persistent database as separate services. Do not use a temporary Codespaces preview as the production memory database.


## Persistent cloud memory with Supabase

OMNI supports a PostgreSQL `DATABASE_URL`. For GitHub Codespaces, configure the Supabase **Session pooler** connection URI as a Codespaces secret named `DATABASE_URL`. The backend normalises Supabase's PostgreSQL URI for psycopg 3 and enforces TLS.

Follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) for project setup, secure secret injection, health verification and migration of the existing Codespace SQLite memories. Keep the Codespaces port private; the current API is not yet authenticated for public deployment.


## Multi-model answer engine

OMNI can ask every configured model independently, synthesize the responses into one answer, run a separate adversarial consistency review, and revise the final answer.

### Configure the model pool

Set these as **GitHub Codespaces secrets** for this repository (never commit provider keys):

- `OMNI_ANSWER_MODELS`: comma-separated LiteLLM model IDs, e.g. `openai/your-model-id,anthropic/your-model-id,gemini/your-model-id`.
- Provider credentials as required by LiteLLM, e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GEMINI_API_KEY`.
- Optional `OMNI_SYNTHESIS_MODEL`: model ID used to combine and finalize the responses. Defaults to the first configured model.
- Optional `OMNI_VERIFIER_MODEL`: model ID used for the separate consistency review. Defaults to a different configured model when possible.

Use provider-supported model identifiers from the LiteLLM model/provider documentation. OMNI supports up to six configured independent answer models per request. At least two must respond successfully.

### Run the answer engine

After adding Codespaces secrets, stop and restart the Codespace so the new secrets are available. Install dependencies, then start the API:

```bash
cd /workspaces/my-ai-agent/backend
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Check `/api/ensemble/status`. It reports whether at least two model IDs are configured. Then use the dashboard's **Ask all models** composer.

Each request makes parallel independent model calls, one synthesis call, one reviewer call, and one final revision call. This costs more than a single-model request and is subject to each provider's pricing, rate limits and availability.

### Accuracy and verification limits

Multi-model synthesis can improve coverage and expose disagreements, but it cannot guarantee 100% accuracy. Models can share errors or repeat unsupported claims. The reviewer checks consistency across supplied responses; it does **not** independently browse or verify external sources. Connect explicit search/retrieval tools and source-backed verification before treating current or high-impact claims as verified. OMNI requires at least two successful independent responses and does not silently return a single-model answer when the ensemble fails.
