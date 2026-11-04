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
