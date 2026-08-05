---
title: "OpenClaw Tightens Session History Key Validation"
excerpt: "OpenClaw PR #85261 keeps malformed session-history URLs inside the owning Gateway route with clear invalid-key errors."
coverImage: '/assets/images/posts/openclaw-2026-8-5-session-history-key-validation.png'
date: '2026-08-05T08:01:00.000Z'
dateFormatted: August 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-5-session-history-key-validation.png'
---

OpenClaw merged [PR #85261, "fix(gateway): reject blank session history keys"](https://github.com/openclaw/openclaw/pull/85261), a Gateway route-boundary fix for malformed direct session-history requests.

The bug was small but sharp. A blank encoded session-history key such as `%20` matched the shape of the route, but the parser treated it like a route miss. That let the request fall through to plugin routing, Control UI routing, or a generic 404 instead of returning the endpoint's own invalid-key response.

Malformed percent encoding such as `%zz` already returned a 400 response. The repair makes blank decoded keys follow the same owner-owned error path.

## Why It Matters

Session history is one of the Gateway's more sensitive operational surfaces. It exposes stored conversation history through a direct REST endpoint, so routing needs to be explicit about three different states:

- This URL is not a session-history request.
- This URL is a session-history request with an invalid key.
- This URL is a valid session-history request.

Before PR #85261, the first two states could collapse together for blank decoded keys. That did not make a valid history readable, but it did mean an invalid request could escape the session-history owner and be interpreted by later routing layers.

That is the kind of edge case OpenClaw has been steadily removing from the Gateway: malformed inputs should be claimed and rejected by the subsystem they targeted.

## Tagged Route Outcomes

The implementation changes the session-history route parser from a nullable string contract into a tagged result. A route miss returns one shape, an invalid key returns another, and a valid key carries the normalized session key.

That removes the hidden `null` versus empty-string sentinel behavior that caused the fallthrough. It also mirrors the adjacent session-kill route contract, which already distinguishes misses from invalid matched requests.

The production change is intentionally narrow. Valid session history reads, authentication, pagination, transcript loading, SSE behavior, plugin routing, and Control UI behavior remain unchanged.

## User Impact

For operators and API clients, the visible change is clearer failure behavior. Requests like `/sessions/%20/history` and `/sessions/%zz/history` now return HTTP 400 with an `invalid session key` error.

That makes debugging easier and keeps malformed traffic out of unrelated fallback paths. It also gives monitoring and client code a consistent signal: the endpoint was recognized, but the session key was invalid.

The PR notes that the issue originated with the direct session-history endpoint and is present in stable `v2026.6.11` and `v2026.7.2-beta.7`.

## Evidence

PR #85261 includes before-and-after real Gateway proof. Before the fix, `/sessions/%20/history` returned HTTP 404. After the repair, both `/sessions/%20/history` and `/sessions/%zz/history` return HTTP 400 with `invalid session key`.

Focused coverage passed 73 session-history HTTP tests and 13 sibling session-kill HTTP tests. Static validation also passed `oxfmt --check`, scoped `oxlint`, `git diff --check`, and `node scripts/check-changed.mjs` for the changed Gateway files.

For most users, this will never be a feature they notice. That is the point. OpenClaw's Gateway is getting better at making invalid requests boring, explicit, and owned by the right layer.
