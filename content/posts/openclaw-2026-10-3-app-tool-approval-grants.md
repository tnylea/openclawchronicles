---
title: "OpenClaw Apps Get Scoped Tool Approval Grants"
excerpt: "OpenClaw Apps can now reuse approval for the same tool while a view stays open, reducing repeated prompts without changing model tool policy."
coverImage: '/assets/images/posts/openclaw-2026-10-3-app-tool-approval-grants.png'
date: '2026-10-03T23:01:00.000Z'
dateFormatted: October 3rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-3-app-tool-approval-grants.png'
---

OpenClaw Apps gained a more usable approval path today with the merge of [PR #164496](https://github.com/openclaw/openclaw/pull/164496), which adds scoped approval grants for app-initiated MCP tool calls while a view remains open.

The problem was easy to feel: an App search box or interactive panel could call an app-only MCP tool repeatedly, sometimes once per keystroke. Before this change, each call could ask the user to approve it again. Broadening the server-wide policy was too blunt, because it could also affect model-driven tool calls.

The new path is narrower. The approval card can now offer **Allow while this App is open** alongside one-time approval and denial.

## What the Grant Covers

The grant is deliberately scoped to the exact requester, App view, MCP server, and tool pair. If the same App view calls the same tool again during the view lease, OpenClaw can reuse the decision without another prompt.

The PR describes several boundaries:

- The grant lives in memory only.
- It ends when the view lease expires, is released, or is replaced.
- A different tool, view, session, or requester prompts again.
- Model-driven calls are unchanged.
- Persistent allowlists are unchanged.

That means this is not a global "always allow this tool" feature. It is a temporary usability grant tied to a live App view and the authority that view already owns.

## Why This Is Safer Than a Broad Allowlist

The implementation rides the existing plugin approval contract, using the standard approval decision shape with a custom action label. The view lease owns the grant, so there is no new persistent store to clean up later.

The PR also calls out an important follow-up found during review: authority has to survive asynchronous preparation correctly. The final implementation carries the current-authority assertion through the guarded-fetch path, checking before physical HTTP work is dispatched. If tool policy is revoked while request preparation is paused, the call is denied instead of sending a late request.

That is the right security shape. Prompt reduction is useful only if it does not turn a temporary UI convenience into stale execution authority.

## The User Experience Win

For users, the improvement should show up most in Apps that feel interactive: search, filtering, preview panels, lookup tools, or anything that makes several similar tool calls while the user is focused on one view.

Instead of forcing the user to decide repeatedly on the same narrow operation, OpenClaw can ask once for the lifetime of that view. The approval remains bounded enough that closing or reconstructing the view resets the question.

## What Stays the Same

The PR is explicit that calls before a view exists still use once-or-deny behavior. The risk-based `auto` policy stays risk-based. macOS keeps plugin approvals review-only. The standalone approval page also keeps its generic label.

In other words, this is not a sweeping approval rewrite. It is a focused fix for App-driven MCP workflows, and the distinction matters. OpenClaw gets fewer noisy prompts in the place where repeated prompts were most annoying, while preserving the separation between human-operated Apps and model-initiated tool use.
