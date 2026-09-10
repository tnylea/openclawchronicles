---
title: "OpenClaw Adds Android Review Changes Viewer"
excerpt: "OpenClaw for Android now lets users inspect uncommitted code changes, select diff lines, copy code, and append precise references back into chat."
coverImage: '/assets/images/posts/openclaw-2026-9-10-android-review-changes-viewer.png'
date: '2026-09-10T23:02:00.000Z'
dateFormatted: September 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-10-android-review-changes-viewer.png'
---

OpenClaw's Android app is getting a more serious code-review surface inside conversations.

[PR #144101](https://github.com/openclaw/openclaw/pull/144101), titled `feat(android): review conversation changes and reference selected lines`, merged on September 10th at 22:50 UTC. It adds a native **Review changes** viewer for uncommitted diffs, letting users inspect patches without leaving the current conversation.

The workflow it addresses is familiar: an agent changes files, the user wants to check a specific hunk, and then the user needs to bring that context back into chat. Before this change, Android users had to leave the conversation, inspect changes elsewhere, then manually copy paths, line numbers, or code into their reply.

## What Android Users Can Do

The new viewer is scoped to uncommitted changes and is powered by Gateway `sessions.diff` snapshots. Repository selection and snapshot limits stay on the Gateway side, while the app renders the review experience with native Compose components.

The PR describes the first version as focused rather than sprawling:

- Open the review viewer from a conversation menu.
- Collapse files and scroll wide patches.
- Swipe to reveal or hide line numbers.
- Long-press diff lines and adjust selection handles.
- Copy only the selected code.
- Append selected code and path references to the current draft with **To chat**.

The important safety detail is that **To chat** does not send automatically. It appends a reference to the existing draft, including the path and selected line range, so the user remains in control before submitting the message.

## Boundaries And Non-Goals

This is not a full mobile replacement for every desktop diff workflow. The PR explicitly keeps selection within one hunk and one side of the diff. It also does not add branch-wide scopes, single-commit scopes, syntax highlighting, or edge auto-scroll in this first pass.

Those limits make sense. The most common mobile need is not to perform a whole review marathon from a phone. It is to inspect what the agent changed, grab the relevant lines, and ask a precise follow-up without losing the thread.

The viewer also closes when users switch conversations or Gateways. That keeps the displayed diff tied to the active session context instead of letting stale code references drift into another conversation.

## Why It Matters

OpenClaw's mobile apps are increasingly important because the product is not only a developer terminal. It is an always-available agent interface. If users can start work from a phone, they also need a credible way to inspect what happened.

Line-level references are especially useful in agent workflows. They turn feedback from "change this part" into something closer to "look at this exact hunk and adjust the behavior here." That reduces ambiguity and helps the next model turn focus on the right code.

## Validation

The PR reports 258 focused Android test executions, Android lint variants, ktlint, native internationalization verification, exact-head CI, and an independent whole-PR review.

The feature depends on Gateway support for `sessions.diff`, so older Gateway connections may not expose it. When available, though, Android now has a practical path for reviewing uncommitted code changes and feeding precise context back into the same OpenClaw conversation.
