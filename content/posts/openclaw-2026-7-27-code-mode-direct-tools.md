---
title: "OpenClaw Code Mode Secures Trusted Direct Tools"
excerpt: "OpenClaw Code Mode now preserves trusted direct tools while keeping shell, file, spoofed MCP, and suspended-run boundaries tighter."
coverImage: '/assets/images/posts/openclaw-2026-7-27-code-mode-direct-tools.png'
date: '2026-07-27T23:15:00.000Z'
dateFormatted: July 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-27-code-mode-direct-tools.png'
---

OpenClaw merged a Code Mode reliability and boundary fix tonight with [PR #114778, "fix(code-mode): preserve direct tools and secure suspended runs"](https://github.com/openclaw/openclaw/pull/114778). The patch targets several cases where Code Mode could either lose tools users expected or accept tool declarations that were not shaped safely enough for execution.

The affected users were running message-only delivery, native desktop or image tools, live-discovered Gemini models, MCP tools with reserved JavaScript or TypeScript names, or suspended Code Mode runs. Those are separate symptoms, but they all sit around one contract: Code Mode needs to expose the right capabilities without widening the authority of a coding session.

## What Changed

The PR preserves only explicitly policy-required, trusted direct tools in embedded and harness Code Mode catalogs. In plain terms, message-only agents can still deliver replies, and desktop, image, or explicitly authorized delivery tools stay available.

At the same time, the fix keeps risky capabilities out of the Code Mode catalog. The PR summary calls out shell, file, and spoofed MCP tools as examples of what should not leak into the available tool surface just because Code Mode needs direct delivery capability.

The patch also shares one canonical provider-transport visibility predicate, which helps keep embedded and harness behavior aligned. For Gemini, authenticated discovery now preserves Google-owned compatibility metadata, so Code Mode auto can correctly activate for preferred discovered Gemini models.

## Reserved Names And Suspended Runs

One practical bug involved MCP tools named after JavaScript or TypeScript reserved words. If a tool name collided with the language grammar, Code Mode could generate unusable declarations. The fix derives reserved MCP declaration identifiers from the existing Acorn keyword contract, so ordinary reserved-name MCP tools can work through the real QuickJS worker.

The security side is in suspended execution ownership. Suspended Code Mode runs did not always enforce the recorded owner identity consistently. After this patch, suspended execution ownership fails closed when the stored identity is missing from the caller.

That is the right default for a resumed coding context. A suspended run should remain tied to its recorded session owner, not drift into another caller's authority just because the resume path lacks identity data.

## User Impact

For operators, the visible outcome is cleaner:

- Message-only agents can deliver replies again.
- Native desktop, image, and explicitly authorized delivery tools remain available.
- Shell and file tools are not exposed simply because Code Mode is active.
- Reserved-name MCP tools can generate usable declarations.
- Preferred live-discovered Gemini models can activate Code Mode auto.
- Suspended executions remain session-scoped.

That combination is what makes the PR notable. It is not only a compatibility fix and not only a hardening pass. It narrows the tool catalog to trusted direct capabilities while restoring several legitimate Code Mode workflows.

## Verification

The maintainers reproduced the failing cases on main before applying the fixes: omitted suspended-run identities, reserved MCP names through the real QuickJS worker, both message-delivery modes, flat and grouped provider payloads, and authenticated paginated Gemini discovery.

Validation included a targeted stress matrix across 30 files, nine Vitest projects, and 956 passing tests. The PR also passed the full changed-surface check, including typechecks, formatting, core and plugin lint, SDK and plugin boundaries, dependency pins, runtime import cycles, state guards, and security guards.

The Docker MCP Code Mode Gateway test passed from a fresh production build and npm tarball. It verified that the real gateway returned `MCP_CODE_MODE_FILE_OK`, read declaration files, invoked the MCP tool once, and reported zero tool-search pollution.

## Bottom Line

[PR #114778](https://github.com/openclaw/openclaw/pull/114778) makes OpenClaw Code Mode more dependable without relaxing its boundaries. Trusted direct tools stay available, spoofed or overbroad tools stay out, and suspended runs now fail closed when caller ownership is incomplete.
