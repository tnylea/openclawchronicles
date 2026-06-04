---
title: "OpenClaw Gets a Universal File Addressing Substrate: Meet oc-path"
excerpt: "A new oc:// URI scheme lands in OpenClaw, giving agents and plugins a single grammar to read and write JSON, JSONC, JSONL, YAML, and Markdown without data loss."
coverImage: '/assets/images/posts/openclaw-2026-5-8-oc-path-addressing-substrate.webp'
date: '2026-05-08T08:00:00.000Z'
dateFormatted: May 8th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-8-oc-path-addressing-substrate.webp'
---

A significant new piece of infrastructure landed in the OpenClaw codebase this morning. Pull request [#78678](https://github.com/openclaw/openclaw/pull/78678) merged the `oc-path` addressing substrate — a universal `oc://` URI scheme for reading and writing structured content across every file format OpenClaw touches.

## What Problem Does It Solve?

If you have ever written an OpenClaw plugin or skill that edits a config file, you have probably run into one of these frustrating bugs: `JSON.stringify` silently eats comments from JSONC files, frontmatter disappears after a Markdown parse, or a YAML emit changes key order and breaks a diff. These were not edge cases — they were reported across at least six separate GitHub issues going back years ([#65623](https://github.com/openclaw/openclaw/issues/65623), [#62438](https://github.com/openclaw/openclaw/issues/62438), [#54310](https://github.com/openclaw/openclaw/issues/54310), [#54311](https://github.com/openclaw/openclaw/issues/54311), [#57091](https://github.com/openclaw/openclaw/issues/57091), [#69475](https://github.com/openclaw/openclaw/issues/69475)).

The `oc-path` substrate solves all of them at once by introducing a single addressing layer with byte-preserving round-trip emitters for every supported format.

## The oc:// URI Grammar

The substrate introduces three universal verbs — `resolveOcPath`, `setOcPath`, and `findOcPaths` — that work identically regardless of whether the target file is JSON, JSONC, JSON5, JSONL, Markdown, or YAML.

The path grammar is expressive:

- **9 predicate operators** — `=`, `!=`, `*=`, `^=`, `$=`, `<`, `<=`, `>`, `>=`
- **Wildcards** — `*` for a single segment, `**` for recursive descent
- **Unions** — `{a,b,c}` to match multiple keys at once
- **Quoted segments** — `"foo/bar"` for keys that contain `/`, `.`, or other reserved characters
- **Positional** — `$first`, `$last`, `-N` for index-based addressing
- **Ordinal** — `#N` for slug-collision disambiguation
- **Session scope** — `?session=cron:daily` for agent-session-scoped reads

## Per-Format Round-Trip Emitters

Each supported file format gets its own parser and emitter that preserves everything a naive `JSON.stringify` or `yaml.dump` would destroy:

- **Markdown** — heading-section, item, table, and code-block addressing; frontmatter survives parse/emit intact
- **JSONC** — AST-preserving parser keeps comments, key order, and trailing commas through writes
- **JSONL** — line-addressed by `Lnnn`, `$first`, `$last`, or `-N`, with per-line value descent and malformed-line skipping
- **YAML** — uses the `yaml` package's Document API to preserve comments and flow style

## Safety Built In

The substrate includes several hardening measures:

- NFC normalization, BOM stripping, and a control-character ban with `\xNN` printable escapes
- Hard limits: `MAX_PATH_LENGTH` (4 KiB), `MAX_SUB_SEGMENTS_PER_SLOT` (64), `MAX_TRAVERSAL_DEPTH` (256)
- An `OcPathError` class with stable machine-readable `code` fields
- A redaction-sentinel guard at every emit boundary, closing a regression where `__OPENCLAW_REDACTED__` literals could end up written to disk

The implementation ships with 41 test files and 669 passing tests covering byte-fidelity, frontmatter edge cases, sentinel guards, real-world fixtures, and cross-kind property testing.

## What Is Not in This PR

The PR author is explicit that CLI verbs (`openclaw path resolve`, `find`, `validate`, `set`) are coming in a follow-up PR. The same goes for the workspace classifier, manifest builder, and the `@openclaw/plugin-sdk` re-export. What landed today is the core substrate — the internal library every subsequent piece will build on.

## Why This Matters for Plugin Authors

Until now, OpenClaw plugins that needed to read or write structured files had to roll their own parsers or reach for general-purpose libraries that were not aware of OpenClaw's format conventions. The `oc-path` substrate gives the whole ecosystem a shared, tested, safe substrate — and one that will eventually be exposed through the plugin SDK once the API stabilizes.

Watch the [openclaw/openclaw](https://github.com/openclaw/openclaw) repository for the follow-up PR that adds the user-facing CLI verbs.
