---
title: "OpenClaw Fixes Ignored Send Clicks During Recovery"
excerpt: "OpenClaw PR #161695 fixes ignored Send clicks by disabling chat submission until account recovery is ready, while preserving drafts."
coverImage: '/assets/images/posts/openclaw-send-clicks-chat-recovery-fix.png'
date: '2026-09-30T08:01:00.000Z'
dateFormatted: September 30th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-send-clicks-chat-recovery-fix.png'
---

A newly merged OpenClaw fix closes a frustrating chat race: clicking **Send** could appear to do nothing after the Gateway handshake completed but before account recovery finished. The change landed in [PR #161695](https://github.com/openclaw/openclaw/pull/161695), titled "fix(ui): avoid ignored Send clicks during chat recovery."

This is a classic reliability issue because the broken behavior was not loud. The user could type a message, press Send, and see no obvious result. The draft stayed in place, but the interface did not clearly communicate why the message had not been admitted.

## The Race Behind the Bug

The pull request explains that an early-history composer exception allowed plain-text Send before `recoveryScopeReady`. The actual native sender, however, still refused queue admission because account recovery had not identified the correct scope yet.

That mismatch produced the awkward middle state. The UI looked ready enough to accept a message, but the sender layer was still waiting for recovery. In the PR's test evidence, the race also sat behind a 30-second wait for "Stop generating" in a real-Gateway end-to-end test.

The key point is that this was not just a button bug. It was an admission-control bug between the composer and the sender. OpenClaw needed the visible submit state to match the actual recovery readiness of the native sending path.

## What Changed

The composer now projects the native sender's pending reason into submission availability. In plain English: if the sender cannot safely admit the message yet, the Send button reflects that state instead of accepting a click that will not go anywhere.

The user-facing result is simple:

- Send shows a disabled, accessible pending state while recovery is not ready.
- The editable draft stays in place.
- Once recovery finishes, ordinary text can submit even while initial history is still loading.
- Control commands, catalog continuation, and suggestion behavior remain preserved.

That last part matters because chat composers in agent UIs are rarely just text boxes. OpenClaw's composer has to handle normal messages, command-like control text, suggestions, catalog continuations, and session state that can change while the page is still hydrating.

## Why This Is Better Than a Silent No-Op

The PR frames the new behavior as fitting OpenClaw's existing account-scoped queue contract. Recovery has to identify the scope before admission. If the scope is not ready, the UI should say, through its controls, that submission is pending.

That is better than accepting input into an invisible refusal path. Disabled state is not glamorous, but it is honest. Users can keep editing the draft, wait for the page to become ready, and send once the underlying sender is able to accept the work.

The fix also requests a render when draft edits change between control-command and ordinary-input intent, so the fast draft-only path cannot hold onto stale availability.

## Validation Was Heavier Than the Patch

The code change is compact. The PR reports a production delta of `+22 / -6 / net +16`. The validation, however, was extensive. The author says the real-Gateway negative control reproduced the original timeout on main, and that with the repaired native gate, Send stayed disabled while recovery was held. The unchanged Stop-after-finished-run flow then passed.

The final composer suite included 32 passing tests covering button, Enter, callback, draft retention, control edits, and suggestion RPC behavior. Additional sender and composer sibling tests passed, along with type, lint, formatting, dead-export, line-limit, and build checks.

## Why Operators Should Care

Ignored input is one of the quickest ways to make an agent product feel unreliable. The agent may be fine, the provider may be fine, and the Gateway may be doing the right thing internally, but if the UI lets users click a button that cannot work yet, the system feels broken.

This OpenClaw fix makes recovery state visible where it matters: at the point of submission. It is a small user-facing change with a large trust payoff. Chat recovery is going to happen on real systems. The important thing is that users can understand when the interface is ready again.
