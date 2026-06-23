---
title: "OpenClaw Caps Untrusted ClawHub and Matrix Reads"
excerpt: "OpenClaw now bounds JSON bodies from ClawHub and Matrix homeservers, reducing memory-exhaustion risk from untrusted upstreams."
coverImage: '/assets/images/posts/openclaw-2026-6-23-untrusted-json-body-caps.png'
date: '2026-06-23T23:00:00.000Z'
dateFormatted: June 23rd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-23-untrusted-json-body-caps.png'
---

OpenClaw merged two related hardening changes on June 23 that close the same class of bug in different parts of the stack: untrusted upstreams could stream response bodies without a firm memory ceiling.

[PR #95226](https://github.com/openclaw/openclaw/pull/95226) bounds ClawHub JSON and error-body reads. [PR #95240](https://github.com/openclaw/openclaw/pull/95240) applies the same idea to Matrix control-plane JSON responses. Neither change adds a flashy feature, but both matter for operators who let an agent talk to marketplaces, homeservers, and other services outside the trust boundary.

## The ClawHub Boundary

ClawHub is a marketplace. That means OpenClaw has to treat it as useful and untrusted at the same time.

Before PR #95226, the shared ClawHub `fetchJson` path used `response.json()`, which buffers the entire response body before parsing. The error path used `response.text()`, which could also buffer an entire body into a diagnostic message. The install-resolution path had one more bare JSON reader for structured install errors.

The fix routes successful ClawHub JSON through a bounded reader with a 16 MiB ceiling. Error snippets now use an 8 KiB cap with a shorter displayed message, so diagnostics remain helpful without becoming an unbounded memory sink.

The PR also keeps failure modes explicit:

- Oversized bodies are cancelled and rejected with a descriptive error.
- Idle reads time out instead of holding sockets open indefinitely.
- Malformed JSON still reports a malformed JSON error.
- Structured install errors continue to preserve their existing behavior.

That last point is important. This is not a protocol redesign. It is a tighter reader around the same marketplace workflows.

## Matrix Gets The Same Treatment

PR #95240 fixes the non-raw JSON path in the Matrix transport. OpenClaw already bounded raw media downloads, including content-length checks and stream cancellation. The JSON path was the gap: it used `response.text()` before `JSON.parse`, which allowed a buggy or hostile homeserver to send a huge body for calls such as `whoami`, read receipts, room directory search, key-backup status, and generic SDK requests.

The new Matrix JSON cap defaults to 8 MiB. Callers can still provide an explicit `maxBytes`, and the existing idle-timeout plumbing now applies to JSON reads too. When a homeserver exceeds the limit, OpenClaw raises a JSON-specific size error rather than reusing media wording.

## Why This Is Worth Covering

Agent runtimes are full of boundaries that look ordinary until they fail. A marketplace response, a homeserver control call, or an error payload can feel boring compared with model routing or tool execution. But these are exactly the places where a small unbounded read can turn into an availability problem.

The pattern in both PRs is conservative:

- Use existing bounded reader helpers.
- Cancel streams on overflow or idle timeout.
- Keep public behavior and data shapes stable.
- Make the trust boundary visible in tests.

The ClawHub PR reports coverage for success, malformed JSON, oversize bodies, idle timeouts, truncated error snippets, and structured install errors. The Matrix PR reports focused transport coverage for preflight content-length rejection, streaming overflow, idle timeout behavior, caller-provided byte limits, and malformed JSON.

For OpenClaw operators, the takeaway is simple: two more untrusted network paths now fail closed before they can grow without bound.
