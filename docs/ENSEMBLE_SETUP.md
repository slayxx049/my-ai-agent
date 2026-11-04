# OMNI AI — Multi-model answer setup

OMNI returns one consolidated answer rather than displaying a pile of separate model replies.

## How one answer is produced

1. **Independent responses:** all model IDs in `OMNI_ANSWER_MODELS` receive the same request separately and in parallel.
2. **Synthesis:** a synthesis model combines complementary answers, removes repetition and preserves real disagreements.
3. **Adversarial review:** a separate reviewer checks the draft against the independent responses for contradictions, unsupported claims, missing caveats and visible reasoning errors.
4. **Final revision:** the synthesis model returns one final answer informed by the review.

OMNI requires at least two successful independent responses. It can use up to six configured answer models. If fewer than two respond, it returns an error instead of pretending a single model is a consensus.

## Configure provider access securely

Do not put API keys in source code, browser JavaScript, `.env.example`, Git commits, or this chat.

1. Open GitHub **Settings → Codespaces**: https://github.com/settings/codespaces
2. Under **Codespaces secrets**, choose **New secret**.
3. Add `OMNI_ANSWER_MODELS` as a comma-separated list of LiteLLM model identifiers. Example format only:

```text
openai/your-model-id,anthropic/your-model-id,gemini/your-model-id
```

4. Add the matching provider credentials as separate secrets, for example:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GEMINI_API_KEY`
5. Under repository access, grant access to `slayxx049/my-ai-agent`.
6. Save each secret.

Use the provider/model identifiers documented by LiteLLM: https://docs.litellm.ai/docs/providers

Optional:
- `OMNI_SYNTHESIS_MODEL`: a model ID to synthesize and write the final answer. Defaults to the first configured model.
- `OMNI_VERIFIER_MODEL`: a model ID for the independent consistency review. Defaults to another configured model where possible.

Only connect provider accounts and API services you are authorised to use. Follow each provider's age, account and billing requirements; get parent/guardian help where a provider requires it. Never bypass age or account restrictions.

## Refresh the Codespace environment

New Codespaces secrets become available after the Codespace is restarted.

1. Stop the currently running Uvicorn server with `Ctrl+C`.
2. Stop the Codespace from the Codespaces menu.
3. Start the same Codespace again.
4. In the terminal, update the repository and install the new dependency:

```bash
cd /workspaces/my-ai-agent
git pull origin main
python -m pip install -r backend/requirements.txt
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

Keep port 8000 private.

## Verify readiness

Open the forwarded port and visit:

`/api/ensemble/status`

Before model configuration, the endpoint reports `"ready": false`. Once at least two model IDs are configured, it reports `"ready": true` and lists the model IDs (never API keys).

Then return to the dashboard. The model status indicator should show the configured model count. Ask a test question using **Ask all models**.

The status endpoint confirms configuration, not that provider credentials, quota or model access are valid. The first actual request tests those.

## What the accuracy check does — and does not do

The reviewer compares model outputs with each other. It does not independently prove facts or browse current sources. Models may share the same error, and a majority vote is not proof. OMNI never advertises a numeric accuracy guarantee.

For claims that depend on current events, prices, laws, scientific updates, or important decisions, connect source retrieval/search tools and verify primary sources. A well-supported answer should distinguish confirmed facts, inference and unresolved uncertainty.

## Cost and latency

A successful request uses:
- one independent call per configured answer model;
- one synthesis call;
- one reviewer call;
- one final revision call.

With three configured models, that is six model calls per user question. Costs, latency and rate limits depend on your providers and chosen models. Start with two models while testing, then add more if the quality improvement is worth the added usage.
