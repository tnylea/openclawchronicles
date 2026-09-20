---
title: "OpenClaw Adds Silent Progress Card Refresh"
excerpt: "OpenClaw PR #154044 adds a progress-card refresh control so users can update saved work status without sending a visible chat message."
coverImage: '/assets/images/posts/openclaw-2026-9-20-progress-card-refresh.png'
date: '2026-09-20T23:02:00.000Z'
dateFormatted: September 20th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-20-progress-card-refresh.png'
---

OpenClaw's Control UI gained a small but useful workflow improvement in [PR #154044](https://github.com/openclaw/openclaw/pull/154044): saved task-progress cards can now be refreshed without inserting a visible chat message.

The PR targets a familiar problem in long-running work. A progress card can become stale while an agent keeps working, but asking for an update through chat creates transcript noise and blurs the difference between requesting status and receiving status.

## The new refresh path

The change adds a refresh button to expanded and collapsed composer progress cards. When pressed, it asks the agent to reconcile the saved card with current work, blockers, and next steps.

The important part is that this is not implemented as a browser-generated `chat.send`. The PR uses a typed, authorized `progressCard.refresh` RPC and OpenClaw's existing trusted internal steering path.

That gives the feature a tighter contract:

- Pending, retry, and updated states preserve draft text, transcript state, disclosure, and the previous card.
- Success requires a newer authoritative saved-card revision.
- Read-only projections remain read-only.
- Refresh input cannot answer pending human-input requests.
- Unconfirmed steering receipts cannot independently abort authorized work.

In other words, the button asks for a better status card; it is not a hidden user reply.

## Why it matters

Progress cards are most valuable when they stay accurate without turning the transcript into a stream of status pings. This change gives users a direct control for that moment: the work is still active, the card looks old, and a refresh should be a UI action rather than a new conversation turn.

That distinction matters in team and automation contexts. A visible chat message can change the social and operational meaning of a session. A card refresh should be lightweight, scoped, and auditable without pretending the user said something new.

The PR also handles retry recovery carefully. It distinguishes finished direct or queued work from accepted steering, rereads saved state after failed or missed change-event reads, and keeps deduplication for unconfirmed steering.

## Validation notes

The evidence section is unusually thorough for a UI feature. The implementation went through formatting, line-cap checks, generated schema consistency, i18n checks, core and UI type checks, style checks, lint, platform checks, database guards, and authorization guards.

Focused tests covered runtime behavior, authorization, transcript visibility, human-input isolation, UI stores, components, and panes. Registered-Gateway integration covered idle dispatch, rejected-steer fallback, confirmed and unconfirmed active steering, concurrent visible human messages, and read-only denial.

The PR also includes browser proof for desktop expanded cards, a 390px collapsed layout, and failure/retry scenarios. Follow-up queued-lifecycle repairs added regressions for separate runtime IDs, progress, terminal no-update, abandonment, consumed steering, and replaced-controller cases.

For OpenClaw users, the visible result is simple: a refresh control beside progress state. Underneath, the team treated it as a real session-control feature rather than just another button in the composer.
