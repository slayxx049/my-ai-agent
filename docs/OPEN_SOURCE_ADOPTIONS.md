# OMNI AI — Open-source research and adoption plan

Research checked on 2026-11-04. GitHub star counts are approximate snapshots and change over time.

OMNI uses these projects as architectural references and optional external integrations. It does not copy their source code into this repository.

| Project | Relevant capability | OMNI use |
|---|---|---|
| [Mem0](https://github.com/mem0ai/mem0) | Persistent memory, extraction and retrieval | Primary memory-management integration candidate |
| [Letta](https://github.com/letta-ai/letta) | Stateful agents and editable long-term memory | Agent memory patterns and optional agent runtime |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Stateful graphs, checkpoints and durable workflows | Supervisor, delegation, retries and resumable runs |
| [Graphiti](https://github.com/getzep/graphiti) | Temporal knowledge graphs with source provenance | Later relationship/history layer if required |
| [Qdrant](https://github.com/qdrant/qdrant) | Vector similarity search | Optional dedicated vector store at larger scale |
| [pgvector](https://github.com/pgvector/pgvector) | Vector search inside PostgreSQL | Initial semantic-search database extension |
| [n8n](https://github.com/n8n-io/n8n) | Visual automation and broad integrations | External automation service connected through APIs/webhooks |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Node-based image and media generation workflows | External creative/drawing/media workflow service |
| [Remotion](https://github.com/remotion-dev/remotion) | Programmatic video compositions and rendering | YouTube/video composition integration |
| [LibreChat](https://github.com/LibreChat-AI/LibreChat) | Multi-provider chat, agents and MCP | UX and integration reference, not a dependency |

## Selected architecture

### Initial database

- SQLite for quick local development.
- PostgreSQL for durable multi-user or hosted deployment.
- pgvector extension enabled in the PostgreSQL Docker image for a future embedding column and semantic retrieval.
- Media files are stored outside the relational database; PostgreSQL stores their metadata, ownership, tags and references.

### Memory layers

1. **Explicit memory records** — facts, project decisions, preferences, reference notes and repeatable workflows that the user can inspect, edit, pin or delete.
2. **Semantic memory** — Mem0 integration candidate for extracting, deduplicating and retrieving relevant memories from conversations.
3. **Temporal relationships** — Graphiti is a later option if OMNI needs to track how project facts and relationships change over time.

The current API implements explicit memory records and text search. It does not yet generate embeddings or call Mem0. Those are follow-on integrations, not claimed as already active.

## Workspace taxonomy

- **coding**: repository context, architecture decisions, language/framework preferences, bug resolutions, code conventions.
- **youtube**: channel identity, audience, topic ideas, scripts, outlines, storyboards, thumbnail briefs and publishing checklists.
- **creative**: project briefs, ideas, reusable prompts, brand systems and output references.
- **drawing**: visual direction, palettes, canvas settings, character/reference descriptions and prompt iterations.
- **automation**: triggers, actions, workflow versions, run outcomes and error resolutions.
- **email**: tone preferences, reusable templates, writing conventions and follow-up rules.
- **general**: cross-workspace preferences and facts explicitly chosen for global use.

## Privacy and security rules

- Never store API keys, passwords, access tokens, recovery codes or private authentication secrets as memories.
- Do not ingest private email inboxes or message bodies automatically. Add explicit, user-reviewed notes only.
- Store file references and media metadata, not large video/image binaries in PostgreSQL.
- Add authentication, per-user tenancy, rate limits, backups and audit events before exposing a backend to the public internet.
- Users must be able to inspect, edit, export and delete memories.
- External model output and retrieved documents are untrusted input.

## Licensing and integration boundaries

Review each upstream license and terms before deploying an integration. ComfyUI is GPL-3.0, Remotion has its own license terms, and n8n uses a fair-code licensing model. Prefer calling these systems as separately deployed services rather than copying their source code into OMNI.
