---
title: "OpenClaw Adds Native Tool Call Support for Kimi Coding Models"
excerpt: "OpenClaw now parses Kimi's tagged tool call format natively, enabling Moonshot's Kimi coding models to use tools reliably without raw markup leaking as text."
coverImage: '/assets/images/posts/openclaw-2026-4-3-kimi-tool-call-parser.png'
date: '2026-04-03T08:00:00.000Z'
dateFormatted: April 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-3-kimi-tool-call-parser.png'
---

Moonshot's Kimi coding models use a tagged format for tool calls rather than native JSON function-calling. [PR #60051](https://github.com/openclaw/openclaw/pull/60051), merged April 3rd from contributor `@obviyus`, adds a dedicated parser to OpenClaw so Kimi's tool call markup is intercepted and decoded correctly — meaning the model can actually use tools like `read`, `write`, and `exec` instead of outputting raw section tags as text.

## The Problem Kimi Had

Kimi coding models emit tool calls wrapped in custom XML-style section tags:

```
<|tool_calls_section_begin|>
<|tool_call_begin|>
... tool call content ...
<|tool_call_end|>
<|tool_calls_section_end|>
```

Without a parser that understands this format, OpenClaw would receive the model's response, see the tags as plain text, and pass them through to the user. No tool execution, no results — just raw markup in the chat window.

## What `parseKimiTaggedToolCalls` Does

The new `parseKimiTaggedToolCalls` function in the Kimi coding extension scans streamed text blocks for this section format. When detected, it:

- Extracts each `<|tool_call_begin|>...<|tool_call_end|>` block within the section
- Parses the tool name, arguments, and generates a unique ID per call
- Returns structured tool call objects that OpenClaw's normal tool execution pipeline can process

This means Kimi models can now perform multi-step agentic workflows — reading files, writing code, running shell commands — with the same reliability as models that use standard JSON function-calling.

## Current Limitations to Know

The parser requires the tool call section to begin at the very start of a text block (after trimming whitespace). If Kimi ever emits a short preamble before the section tags — like `"Let me do that: <|tool_calls_section_begin|>..."` — the parser won't match and the markup will pass through as text. This is a known edge case noted during review; it may be addressed in a follow-up.

Additionally, while the parser handles multiple tool calls within a single section (using a cursor-advance loop), this path wasn't covered by the initial test suite. If you're seeing issues with parallel tool calls in Kimi sessions, that's the area to watch.

## Why Kimi for OpenClaw?

Kimi's coding-specific models offer a competitive option for users who want capable code generation without relying on Anthropic or OpenAI. With native tool call support landed, Kimi k1.5 and similar models become viable for real agentic work inside OpenClaw — not just conversational use.

If you've had Kimi configured but found tools weren't firing, pull the latest OpenClaw version and test again.

- [PR #60051 on GitHub](https://github.com/openclaw/openclaw/pull/60051)
- [Kimi / Moonshot provider docs](https://docs.openclaw.ai)
- [OpenClaw multi-agent routing](https://docs.openclaw.ai/concepts/multi-agent)
