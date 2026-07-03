---
title: "OpenClaw Rotates Google Gemini API Keys"
excerpt: "OpenClaw now rotates Google Gemini API keys for LLM streams, improving resilience when one key hits quota or rate limits."
coverImage: '/assets/images/posts/openclaw-google-gemini-key-rotation.png'
date: '2026-07-03T23:12:00.000Z'
dateFormatted: July 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-google-gemini-key-rotation.png'
---

OpenClaw's Google provider path gained a practical resilience fix today in [PR #97328, "fix(google): rotate Gemini API keys for LLM requests"](https://github.com/openclaw/openclaw/pull/97328). The patch makes Gemini LLM streaming use the same kind of key-rotation behavior that already existed for embeddings.

The result is a better failure story for users who configure multiple Gemini API keys. If the first key hits a rate limit or quota response, OpenClaw no longer has to fail the LLM stream immediately just because that first credential was exhausted.

## What Changed

PR #97328 fixes a mismatch between Gemini embedding requests and Gemini LLM streaming requests. The PR explains that users with multiple Gemini API keys configured could still see LLM streaming fail immediately when the first key hit a rate limit or quota response.

That is frustrating because key rotation already existed elsewhere. Embeddings could use the rotation helper, but the LLM stream path resolved only one key before sending the provider request.

The fix routes official Google Generative AI stream setup through OpenClaw's existing provider API-key rotation helper before SSE chunks are emitted. The PR is careful about the security boundary: environment-key rotation is allowed only for the official Google Generative AI HTTPS host, while Vertex and OAuth credential modes remain separate.

For operators, the practical benefit is better availability. If one configured Gemini key is rate-limited, OpenClaw has a chance to try the next eligible key before the model turn fails.

## Why It Matters

Provider integrations fail in ordinary ways: quota limits, rate limits, bad tokens, expired credentials, and noisy upstream diagnostics. The difference between a rough integration and a production-ready one is how predictably the agent handles those failures.

This Google fix improves that predictability where users are most likely to notice it: the live LLM stream. When an agent is mid-turn, a quota-limited first key should not necessarily be the end of the request if the operator has already provided other eligible keys.

The PR is also careful about scope. It does not blur OAuth, Vertex, and API-key modes together. It improves the official Google Generative AI HTTPS path while keeping credential boundaries explicit.

That makes the change both useful and conservative. OpenClaw gets better availability for a common Gemini setup without turning key rotation into a broad provider credential rewrite.

## Evidence and Risk

The PR carries the `extensions: google`, `proof: sufficient`, `merge-risk: auth-provider`, and `merge-risk: security-boundary` labels. That combination is a good summary of the work: it touches a sensitive provider boundary, but it comes with enough proof for maintainers to merge it.

The body describes the fix as routing official Google Generative AI stream setup through the existing provider API-key rotation helper before SSE chunks are emitted. It also calls out what did not change: Vertex, OAuth JSON credentials, OAuth personal credentials, and non-official hosts stay outside the env-key rotation path.

For operators, that matters. Provider hardening should not surprise credential owners. A key-rotation fix is only a win if it stays inside the credential mode the user actually selected.

## Bottom Line

OpenClaw's Google provider path is getting more flexible where flexibility helps: retrying Gemini LLM streams with another configured API key when the first one hits quota or rate-limit pressure.

For Gemini users with multiple keys configured, [PR #97328](https://github.com/openclaw/openclaw/pull/97328) is a meaningful maintenance win ahead of the next OpenClaw release.
