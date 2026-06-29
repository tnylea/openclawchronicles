---
title: "OpenClaw Fixes Ollama Cloud Tool Calls"
excerpt: "OpenClaw PR #96474 fixes second-turn Ollama Cloud tool-call failures by preserving OpenAI-compatible JSON argument strings."
coverImage: '/assets/images/posts/openclaw-2026-6-29-ollama-cloud-tool-call-fix.png'
date: '2026-06-29T23:02:00.000Z'
dateFormatted: June 29th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-29-ollama-cloud-tool-call-fix.png'
---

OpenClaw merged [PR #96474](https://github.com/openclaw/openclaw/pull/96474) tonight to fix a sharp Ollama Cloud regression: tool-calling conversations could fail on the second agent turn when OpenClaw replayed a previous assistant tool call through the OpenAI-compatible Chat Completions route.

The user-visible failure was a 400 response after a tool call. The underlying mismatch was subtle. Ollama's native `/api/chat` route expects tool-call arguments as objects, while the OpenAI-compatible `/v1/chat/completions` route expects `tool_calls.function.arguments` as JSON strings. OpenClaw's compat wrapper was converting replayed function arguments back into objects, which broke the OpenAI-compatible request contract.

## The Second-Turn Trap

Tool calling often works on the first turn because the model emits the tool request and the runtime handles it immediately. The harder case is replay. On the next turn, the runtime sends conversation history back to the provider, including the assistant's previous tool call.

That replay has to match the provider's expected wire format. For OpenAI-compatible Chat Completions, the previous `function.arguments` field is a string containing JSON. For native Ollama, the equivalent path can keep object arguments.

PR #96474 removes the extra compatibility mutation that changed replayed OpenAI-compatible arguments into objects, while keeping native Ollama normalization intact.

## Why This Matters For Operators

Ollama is no longer only a local-model story. Ollama Cloud and OpenAI-compatible routes make it part of the same provider-mixing world as OpenAI, Anthropic, Gemini, DeepSeek, and other model services. OpenClaw operators increasingly expect to switch providers without discovering that a tool-call transcript only works in one route.

This fix is important because multi-turn tool use is the normal agent path:

- The user asks for something.
- The model requests a tool call.
- OpenClaw runs the tool and stores the result.
- The next turn replays the prior assistant tool call.
- The model continues from that state.

If the replay payload is malformed, the agent gets stuck exactly when it should be continuing useful work.

## Evidence In The PR

The PR includes a concrete after-fix proof. The author tested the current source checkout through the actual `streamOpenAICompletions` OpenAI SDK HTTP path, the Ollama compatibility wrapper, and a local OpenAI-compatible `/v1/chat/completions` endpoint that captured the request body.

The captured second-turn request showed `tool_calls[0].function.arguments` as a string with the value `{"action":"config.get","path":"gateway.port"}`. In the same proof, the native Ollama sibling still returned object arguments for `/api/chat`.

That is exactly the split OpenClaw needs: preserve OpenAI-compatible strings for the Chat Completions contract, and preserve object arguments for native Ollama.

## A Small Fix With Provider-Routing Value

The best provider fixes are often boring. This one does not add a new model or a flashy capability. It makes an existing route obey its own contract across replay, which is what keeps real agent sessions from falling apart after the first tool call.

It also matches a broader June trend in OpenClaw: provider integrations are being tightened at the edges. Recent work has bounded oversized provider responses, normalized auth and routing paths, and clarified where compatibility wrappers should stop mutating payloads.

For Ollama Cloud users, the practical result is simple: multi-turn tool-calling conversations should continue instead of failing immediately after the first tool call. For OpenClaw as a whole, it is another step toward provider routing that feels interchangeable without hiding the differences that actually matter.
