---
title: "OpenClaw CLI Transcript Persistence and Ollama Provider Fix Ship Today"
excerpt: "Two PRs merged overnight bring CLI agent session history to OpenClaw and fix a frustrating Ollama 404 error caused by an un-stripped provider prefix."
coverImage: '/assets/images/posts/openclaw-2026-4-16-cli-transcripts-ollama-fix.png'
date: '2026-04-16T08:05:00.000Z'
dateFormatted: April 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-16-cli-transcripts-ollama-fix.png'
---

Two pull requests merged in the early hours of April 16 bring a meaningful new capability and a well-targeted bug fix to OpenClaw. Together they improve the experience for anyone running CLI-backed agents like Codex or Claude Code through the gateway, and for anyone using Ollama as a local model provider.

## CLI Agent Turns Now Persist to Session Transcripts

[PR #67490](https://github.com/openclaw/openclaw/pull/67490) by [@obviyus](https://github.com/obviyus) adds `persistCliTurnTranscript()` to the attempt execution layer. When a CLI-backed agent (one where `result.meta.executionTrace?.runner === "cli"`) completes a turn, OpenClaw now writes both the user prompt and the assistant reply into the session transcript via `SessionManager.appendMessage`.

### What This Unlocks

Before this change, conversations with CLI agents like Codex effectively vanished after each session — OpenClaw had no durable record of what was asked or answered. With transcripts enabled, you get:

- **Session recall**: the gateway can reference earlier CLI turns for context
- **Dreaming and memory ingestion**: CLI sessions become eligible for OpenClaw's memory consolidation pipeline
- **Audit trails**: useful for team setups where multiple people share a gateway

### Security Considerations

An automated security review flagged three medium-severity concerns worth knowing about:

1. **Unbounded payload concatenation** — if a CLI provider returns an extremely large output, the current implementation concatenates everything in memory before writing. The reviewer recommends capping the total character budget (e.g. 50,000 chars) before persistence.

2. **Untrusted metadata in transcripts** — provider, model, and usage data come from the CLI agent's own `agentMeta` output, which means a misbehaving agent could spoof billing entries. Recommended fix: sanitize and clamp token counts; derive provider from config rather than agent output.

3. **No secret redaction** — CLI agents can read local files and print credentials. The PR doesn't scrub transcript content before writing to disk. A follow-up opt-in flag and secret-scrubbing pass is recommended.

None of these are show-stoppers for most setups, but they are worth tracking for production deployments with sensitive environments. Watch the [PR thread](https://github.com/openclaw/openclaw/pull/67490) for follow-up hardening.

## Ollama Model IDs No Longer Cause 404 Errors

[PR #67457](https://github.com/openclaw/openclaw/pull/67457) by [@suboss87](https://github.com/suboss87) fixes a quiet but frustrating bug in the Ollama chat request path.

When OpenClaw is configured to use an Ollama model — either via setup or by setting the primary model to `ollama/<model-name>` — the model ID was passed directly to the Ollama API without stripping the `ollama/` prefix. The Ollama API does not understand the prefixed format, so every request returned a 404.

```
# Before: sent to Ollama API as-is
ollama/llama3.2

# After: prefix stripped before the request
llama3.2
```

Interestingly, the embedding path (`normalizeEmbeddingModel` at line 100) already handled this correctly. Only the chat stream path was affected. The fix brings the chat path into alignment with the embedding path.

This closes [issue #67435](https://github.com/openclaw/openclaw/issues/67435) and should resolve 404 failures that appeared silently even with a correctly configured Ollama endpoint.

## How to Get These Changes

Both fixes are in the `main` branch and will land in the next tagged release. Monitor the [releases page](https://github.com/openclaw/openclaw/releases) for the next beta or stable build. Once released:

```bash
npm install -g openclaw@latest
openclaw gateway restart
```

If you're running Ollama and hitting 404s today, these are likely your culprit — the fix is confirmed merged.
