---
title: "OpenClaw v2026.4.9 Released: Memory Dreaming, REM Backfill, and a Major Security Batch"
excerpt: "OpenClaw v2026.4.9 is out with grounded REM backfill for memory dreaming, provider auth aliases, QA vibes reports, and 10+ security fixes."
coverImage: '/assets/images/posts/openclaw-2026-4-9-release.png'
date: '2026-04-09T23:00:00.000Z'
dateFormatted: April 9th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-9-release.png'
---

📦 OpenClaw v2026.4.9 dropped on April 9th, 2026, and it is a meaty one. The headline feature is a fully grounded REM backfill lane for the Memory/Dreaming subsystem — old daily notes can now replay into Dreams and have durable facts extracted from them. Alongside that, there is a polished Control UI for diary management, a new QA evaluation harness, provider auth aliases, iOS CalVer pinning, and a substantial security batch with ten distinct fixes. Let's go through everything.

---

## Memory / Dreaming: Grounded REM Backfill

The biggest feature in this release is the grounded REM backfill lane. Previously, the Dreams system could only work with notes that were already in the live short-term memory pipeline. Historical daily notes — everything you wrote before Dreams was active — were stuck outside the loop.

Now, `rem-harness --path` lets you point the REM pipeline at any path of historical notes. The harness runs the full grounded backfill lane: durable-fact extraction, diary commit/reset flows, and live short-term promotion integration. Old notes replay into Dreams and the facts they contain become part of your grounded memory.

This is a significant quality-of-life improvement for anyone who has been using daily notes for a while. Your entire note history can now contribute to Dreams instead of just the slice written after you enabled it.

The diary commit/reset flows ensure that backfill runs are transactional — if something goes wrong mid-run, you can reset to the prior committed state. Durable-fact extraction is also more robust in this release, with hardened inputs and normalized diary headings to reduce parse errors on older note formats.

---

## Control UI / Dreaming: Diary Management View

The Control UI has a new structured diary view for the Dreams system. It surfaces a timeline navigation interface so you can browse diary entries, see which entries have been backfilled, and identify gaps. Backfill and reset controls are available directly from the UI — you no longer need to drop to the CLI to trigger `rem-harness` or roll back a bad run.

Dreaming summaries are now traceable in the UI, meaning you can inspect what facts were extracted from which source entries. The Scene lane also shows promotion hints — visual cues indicating which short-term memories are candidates for promotion to grounded facts.

A safe "clear grounded" action is available for when you need to wipe the grounded memory store and start fresh. It requires explicit confirmation and is designed to prevent accidental data loss.

---

## QA / Lab: Character-Vibes Evaluation Reports

The QA lab now supports character-vibes evaluation reports. These reports let you assess how consistently a model maintains a given persona or character voice across a run. You can select which model to evaluate against and run evaluations in parallel across multiple configurations. This is particularly useful for teams building on top of OpenClaw who need to validate that persona-tuned prompts are holding up as models change.

---

## Plugins / Provider Auth: `providerAuthAliases`

Provider auth configuration has become more flexible with the addition of `providerAuthAliases`. Provider variants (e.g., a fine-tuned model endpoint that shares credentials with a base provider) can now declare aliases so they reuse the same env vars, auth profiles, and config-backed auth as the canonical provider — without requiring any core-specific wiring. This eliminates a common source of duplicate credential configuration and makes it easier to add provider variants as plugins.

---

## iOS: CalVer Version Pinning and TestFlight Workflow

iOS builds now use CalVer version pinning via `apps/ios/version.json`. This aligns iOS versioning with the rest of the OpenClaw release cadence and makes it straightforward to track which code revision corresponds to a given TestFlight build. The TestFlight iteration workflow has also been documented and streamlined ([PR #63001](https://github.com/openclaw/openclaw/pull/63001)).

---

## Security Fixes (Summary)

v2026.4.9 includes ten security fixes — this is one of the largest security batches in a single release. The highlights:

- **SSRF quarantine bypass via browser interactions** — safety checks now re-run after interaction-driven navigations ([PR #63226](https://github.com/openclaw/openclaw/pull/63226))
- **Dotenv injection** — runtime-control and browser-control env vars blocked from untrusted workspace `.env` files ([PR #62660](https://github.com/openclaw/openclaw/pull/62660), [#62663](https://github.com/openclaw/openclaw/pull/62663))
- **Node exec event sanitization** — remote exec events marked untrusted, node-provided text sanitized ([PR #62659](https://github.com/openclaw/openclaw/pull/62659))
- **Exec approval path protection** — model-facing config writes blocked from changing exec approval paths ([PR #62001](https://github.com/openclaw/openclaw/pull/62001))
- **Host env sanitization** — Java, Rust/Cargo, Git, Kubernetes, and cloud credential env overrides blocked ([PR #59119](https://github.com/openclaw/openclaw/pull/59119), [#62002](https://github.com/openclaw/openclaw/pull/62002), [#62291](https://github.com/openclaw/openclaw/pull/62291))
- **Allowlist authorization** — `/allowlist add` and `/allowlist remove` now require owner authorization ([PR #62383](https://github.com/openclaw/openclaw/pull/62383))
- **Request body leak on redirects** — bodies dropped on cross-origin 307/308 redirects ([PR #62357](https://github.com/openclaw/openclaw/pull/62357))
- **SSRF redirect hops** — main-frame redirect hops treated as navigations for SSRF blocking ([PR #62355](https://github.com/openclaw/openclaw/pull/62355))
- **Plugin auth-choice ID collision** — untrusted workspace plugins blocked from colliding with bundled provider auth IDs ([PR #62368](https://github.com/openclaw/openclaw/pull/62368))
- **Dependency audit** — `basic-ftp` pinned to 5.2.1 for CRLF injection fix; Hono bumped

If you are on any prior version, security alone makes this a mandatory upgrade.

---

## Other Notable Fixes

- **Android/pairing** — Stale setup-code auth cleared on new QR scans; pairing auto-retry paused while backgrounded ([PR #63199](https://github.com/openclaw/openclaw/pull/63199))
- **Matrix/gateway** — Gateway now waits for Matrix sync readiness before declaring startup successful ([PR #62779](https://github.com/openclaw/openclaw/pull/62779))
- **Slack/media** — Bearer auth preserved for same-origin `files.slack.com` redirects ([PR #62960](https://github.com/openclaw/openclaw/pull/62960))
- **Sessions/routing** — Established external routes preserved on inter-session announce traffic ([PR #58013](https://github.com/openclaw/openclaw/pull/58013))
- **Control UI/models** — Provider-qualified refs for OpenRouter catalog models now preserved correctly ([PR #63416](https://github.com/openclaw/openclaw/pull/63416))
- **Agents/timeouts** — LLM idle timeout inherits `agents.defaults.timeoutSeconds`; idle watchdog disabled for cron runs when unconfigured

---

## Get the Release

Full release notes and build artifacts are on the [GitHub releases page](https://github.com/openclaw/openclaw/releases). Update via your package manager or pull the latest image. As always, back up your workspace before upgrading if you are running a self-hosted deployment with custom configuration.
