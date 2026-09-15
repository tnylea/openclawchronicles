---
title: "OpenClaw Fixes Files Search Whitespace"
excerpt: "OpenClaw PR #149362 makes Files search ignore surrounding whitespace consistently across project and artifact groups."
coverImage: '/assets/images/posts/openclaw-2026-9-15-files-search-whitespace.png'
date: '2026-09-15T23:04:00.000Z'
dateFormatted: September 15th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-15-files-search-whitespace.png'
---

OpenClaw merged [PR #149362](https://github.com/openclaw/openclaw/pull/149362), a P2 Control UI fix for Files search behavior.

The bug was small enough to miss and annoying enough to matter. Searching Files with surrounding spaces could hide matching changed files, read files, and artifacts, while the project tree still showed matching results. A query like ` inventory ` could therefore feel inconsistent: one part of the interface found the file, while another appeared empty.

## What Changed

All Files groups now ignore surrounding query whitespace consistently. Spaces inside a query remain literal, so users can still search for names or phrases where internal spacing matters.

The implementation reuses the existing string normalization helper that project search already used. The rail had been applying the raw query, which explains the mismatch between project-tree results and the Changed group.

The practical behavior is straightforward:

- Leading spaces no longer hide valid Files matches.
- Trailing spaces no longer hide valid Files matches.
- Whitespace-only queries are handled consistently.
- Internal spaces remain part of the search.
- No migration or configuration change is required.

## Why It Matters

Search is one of the main ways users navigate active OpenClaw work. Changed files, read files, artifacts, and project files need to agree on what a query means. When they do not, users can waste time checking whether a file was lost, ignored, or simply filtered by an invisible character.

This is especially relevant in generated or pasted text. It is easy to copy a file hint, symbol, task note, or inventory label with an extra space at either end. The UI should be forgiving at that boundary without changing the meaning of intentional internal spaces.

PR #149362 brings the Files rail into line with project search and makes the result set easier to trust.

## The Proof

The PR says the issue was reproduced in real Mac Chrome against an isolated live Gateway and a synthetic OpenAI-generated workspace. The query ` inventory ` showed three project matches but no Changed group before the fix. After the repair, the production UI showed the matching changed file and the same three project matches.

The regression failed before the repair and passed afterward. The PR reports 39 focused rail and workspace lifecycle tests, including whitespace-only and literal internal-space coverage.

UI build, formatting, diff checks, and independent scoped review passed. The PR also includes before-and-after screenshot evidence showing the hidden changed-file case and the corrected result.

## What To Watch

The branch included an unrelated test-only fix needed for a shared CI prerequisite, but the Files search behavior itself is narrow. It does not add a new search engine or change project-tree semantics.

For users, the fix should simply make the Files rail feel less brittle. If a query has accidental padding, OpenClaw should now show the same relevant changed, read, artifact, and project matches instead of splitting the interface into two different answers.
