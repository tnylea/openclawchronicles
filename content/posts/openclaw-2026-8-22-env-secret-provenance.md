---
title: "OpenClaw Keeps Env Secrets From Becoming Literals"
excerpt: "OpenClaw now tracks inline env secret provenance so unresolved shorthand does not cross provider or Gateway auth boundaries as literal text."
coverImage: '/assets/images/posts/openclaw-2026-8-22-env-secret-provenance.png'
date: '2026-08-22T08:00:00.000Z'
dateFormatted: August 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-22-env-secret-provenance.png'
---

OpenClaw merged a high-value secret-handling fix just after midnight UTC: [PR #127685](https://github.com/openclaw/openclaw/pull/127685) preserves the provenance of inline environment-variable shorthand through config substitution, snapshots, and credential consumers.

The issue was subtle but important. If a user authored `$NAME` or `${NAME}` as an inline env SecretRef and that variable could not be resolved, some read-only consumers could treat the unresolved text as a literal credential. The inverse case was also possible: a real secret value that happened to look like `$OTHER` could be reinterpreted as another SecretRef and reported unavailable.

Both outcomes are bad. One can push placeholder text toward an outbound authentication boundary. The other can make a valid credential look broken.

## What Changed

The repair adds a narrow, path-indexed provenance fact when exact env shorthand remains pending. That fact is carried through config snapshots, clones, and reloads, then consumed when materialization replaces the value.

That gives OpenClaw a reliable answer to a question string matching cannot answer: did this value come from the user's authored shorthand, or is it the resolved secret value itself?

The PR routes that fact through the boundaries that matter most:

- Gateway planning and materialization
- command-secret snapshots
- model authentication
- model probe targets
- interactive Gateway client bootstrap

The model-provider path also uses the canonical merged provider entry, so provider key normalization and credential provenance cannot silently choose different entries.

## Why It Matters

Agent runtimes increasingly rely on layered configuration: global defaults, per-agent providers, inline SecretRefs, and runtime materialization. In that shape of system, a credential value is not just a string. Its origin matters.

Before this fix, consumers sometimes had to infer intent from the resolved text. That is fragile because `$MISSING` can be either an unresolved shorthand or a perfectly valid literal returned from another secret source.

[PR #127685](https://github.com/openclaw/openclaw/pull/127685) moves the system away from guessing. It records the provenance at the config/env substitution boundary and lets downstream auth consumers use that authoritative signal.

For operators, the behavior is straightforward:

- unresolved shorthand no longer crosses auth boundaries as a credential;
- resolved credentials remain valid even if their literal text resembles env-template syntax;
- no new config option, environment variable, dependency, database state, or process-global state is introduced.

## Validation

The PR reports a broad focused proof set. The original pre-fix regression failed in `src/commands/models/list.probe.targets.test.ts` because unresolved `$MISSING` and `${MISSING}` values were emitted as configured probe credentials.

After the repair, the author reports 351 focused tests passing across config/env substitution, Gateway planning, probe auth, command-secret resolution, model auth, model probe targets, daemon install, and secret runtime snapshots. Core source typechecking, affected test typecheck shards, formatting, focused lint, and an exact-head CI run also passed.

## Bottom Line

This is a quiet security-boundary improvement. OpenClaw now remembers whether a credential-looking string is unresolved env shorthand or a real resolved value, then keeps that distinction intact across provider and Gateway authentication paths.

That is the kind of plumbing that makes configuration-heavy agent installs safer without asking users to change how they write their configs.
