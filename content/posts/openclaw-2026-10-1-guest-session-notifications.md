---
title: "OpenClaw Lets Guests Notify Owned Child Sessions"
excerpt: "OpenClaw PR #162986 fixes guest-owned child session notifications without granting broad write permission or changing queue semantics."
coverImage: '/assets/images/posts/openclaw-2026-10-1-guest-session-notifications.png'
date: '2026-10-01T23:03:00.000Z'
dateFormatted: October 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-1-guest-session-notifications.png'
---

OpenClaw merged a focused session-permission fix tonight in [PR #162986](https://github.com/openclaw/openclaw/pull/162986), titled "fix: allow guests to notify owned child sessions." The change fixes a mismatch that blocked operators with narrow `operator.sessions.write` authority from using `sessions_send(mode: "notify")` on their own child sessions.

The bug was subtle but important. The child session passed the tool's visibility checks, but the notification adapter authorized the mutation as the broader `agent` operation. That meant a guest could be allowed to see and target their own child session, then get rejected with `missing scope: operator.write`.

## What Changed

The in-process mutation helper now takes the operation being authorized. Notifications select `sessions.send`, which already supports narrow session-write authority, and the adapter maps the session key to that operation's `key` field.

That lets OpenClaw authorize the actual action being requested instead of accidentally escalating the check to a broader agent-write operation.

The PR keeps the surrounding fences intact:

- Authorized guests can queue context for an owned child session.
- Ordinary write-scoped operators keep the same ability.
- Notifications do not start a new run.
- Foreign-owned visible children remain denied.
- Source revocation or role narrowing during preparation prevents enqueueing.
- If the canonical target is deleted before authorization resumes, the notification fails and the queue stays empty.

The change does not alter guest roles, the general `agent` RPC, active-run steering, shared publishing, or sandbox setup.

## Why It Matters

OpenClaw increasingly uses scoped authority rather than all-or-nothing operator power. That is good for collaboration, guest access, and shared environments, but it only works if the implementation checks the same operation the user is actually performing.

In this case, `notify` is narrower than a full agent mutation. It queues context for an existing owned child; it does not create a session, broaden permissions, or steer an active run. Treating it as the broader `agent` operation made the security model feel stricter than intended while still not improving the boundary.

The repair keeps the permission boundary honest. A guest can do the thing they are scoped to do, and still cannot touch someone else's child session or keep enqueueing after authority changes.

## Validation

The regression coverage uses the real session tool, in-process Gateway authorization, SQLite-backed ownership, and the system-event queue. That is heavier than a mocked unit test, but the PR argues this boundary needs the real owners because mocking authorization or persistence would miss the incorrect operation, target-field mapping, or lifecycle admission.

The six-case Linux suite covers guest and ordinary write-scoped enqueueing, foreign-owned denial, source revocation, role narrowing, and target deletion before authorization resumes. The same suite passed locally and on hosted CI.

The PR also reports formatting, lint, generated-contract checks, documentation checks, security checks, production and test compiler coverage, package-boundary compilation across all 127 plugins, a full build, a selected Gateway plan, a complete native affected run, and a real-Gateway initial-setup smoke covering queued browser and `sessions_send` input.

## The Practical Result

For users, this should feel like less friction in delegated or guest-driven workflows. If a guest owns a child session and has session-write authority, they can queue context to it without needing broad write access.

For administrators, the useful part is what did not change. The fix does not loosen foreign ownership checks or turn notify into a session-creation path. It simply lines up authorization with the operation OpenClaw already intended to support.
