---
title: "OpenClaw Saves Human Notes During Wiki Prune"
excerpt: "OpenClaw fixes a P0 memory-wiki data-loss path by salvaging human Notes blocks before imported source pages are pruned."
coverImage: '/assets/images/posts/openclaw-2026-7-31-memory-wiki-notes-salvage.png'
date: '2026-07-31T23:05:00.000Z'
dateFormatted: July 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-31-memory-wiki-notes-salvage.png'
---

OpenClaw merged a P0 memory-wiki data-loss fix in [PR #102294](https://github.com/openclaw/openclaw/pull/102294), titled `fix(memory-wiki): salvage human Notes before pruning imported source pages`.

The issue was narrow, but the severity label makes sense. When `pruneImportedSourceEntries` removed an imported page whose sync key had legitimately left the active set, it deleted the page file directly. If a person had added a `## Notes` block to that page, those notes could disappear with no salvage file, archive, or tombstone.

That is exactly the kind of bug memory tools have to avoid. Generated or imported content can be rebuilt. Human annotations usually cannot.

## What Went Wrong

Normal memory-wiki syncs already protect notes through `preserveHumanNotesBlock`. The prune path bypassed that protection. It called file removal without first reading the page and checking whether it contained human-authored notes.

The result was an asymmetry: notes survived ordinary source updates, but they could be lost when an imported source page was pruned.

PR #102294 repairs that by reading the page before removal and extracting the human Notes block only after the expected content fence. That mirrors the existing markdown parsing boundary, so source content that merely contains marker-like text is not accidentally treated as human notes.

## The New Salvage Path

When notes are found, OpenClaw writes them to a `.salvage/<page>.notes.md` file under the vault root using sanitized filenames. If the salvage write fails, OpenClaw keeps the original page instead of deleting it.

That fail-safe choice is the right one. A prune operation should never destroy user-authored notes just because the recovery file could not be written.

The PR does not add network calls, new permissions, or a broader security surface. It is scoped to the memory-wiki plugin under `extensions/memory-wiki/src/`, with the behavior centered on preserving local user content.

## Evidence And User Impact

The PR includes an end-to-end production-function proof showing a page deleted after prune while its human notes were preserved in `.salvage/`. It also verifies that source markers were not salvaged as notes.

Regression coverage includes cases for salvaging notes before pruning, skipping salvage for pages without notes, handling already-missing page files, avoiding false positives inside source content, and keeping the page when salvage writing fails. The focused test command reported one file passing with nine tests total, and the PR notes a clean autoreview with `patch is correct` confidence.

For operators, the practical impact is reassuring: memory-wiki can keep pruning stale imported source pages, but human Notes blocks now get a recovery path. That keeps automated source cleanup from silently deleting the part of the wiki that matters most.

