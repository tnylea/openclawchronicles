---
title: "OpenClaw Fixes GitHub Folder Link Labels"
excerpt: "OpenClaw now keeps repository context visible when nested GitHub folder links appear in Control UI chat messages."
coverImage: '/assets/images/posts/openclaw-2026-9-24-github-folder-links.png'
date: '2026-09-24T23:01:00.000Z'
dateFormatted: September 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-24-github-folder-links.png'
---

OpenClaw merged a small but highly visible Control UI repair tonight: nested GitHub folder links now keep their repository context when rendered in chat. The fix landed in [PR #157619](https://github.com/openclaw/openclaw/pull/157619), "fix(ui): GitHub folder links lose repository context."

The bug was straightforward from a user's point of view. Pasting a GitHub folder URL into a message could produce a shortened label that removed the owner and repository. That made the link harder to trust at a glance, especially when a conversation included multiple repos, branches, or implementation references.

## What Changed

The formatter already handled some GitHub file links specially, but nested tree links could fall through to a generic shortening path. That fallback dropped the first two path segments, which are exactly the segments people need most: the owner and repo.

The merged fix gives GitHub tree links an explicit path formatter. Instead of guessing where a branch ends and a folder path begins, it preserves the repository label and uses middle truncation for the rest of the path.

That distinction matters because Git branch names can contain slashes. A naive split can make a link look tidy while silently removing the useful part of the address. The new behavior keeps the label compact without pretending the branch/path boundary is simpler than it is.

## Why This Matters

OpenClaw chats often contain links to source, docs, issues, and implementation notes. When the assistant or a teammate shares a folder reference, the rendered label should help the reader answer two questions quickly:

- Which repository is this?
- Where inside that repository does the link point?

Losing the repository name turns a useful inline reference into a vague path fragment. It also makes screenshots and exported conversations less clear, because the destination has to be inferred from the full URL tooltip or by opening the link.

PR #157619 keeps click destinations, full URL tooltips, authored labels, file links, and issue/PR chips unchanged. The change is focused on display quality for folder links, not on altering link targets.

## Verification

The PR includes regression coverage for the reported case and related GitHub link types. Its evidence reports 342 focused renderer, GitHub-reference, file-link, and preview-target tests passing. Five cases failed against the original formatter and passed after the repair.

The team also captured the real Control UI at desktop and mobile widths, including a 390-pixel-wide phone case. The after screenshots verified that the compact folder label preserved repository context without mobile horizontal overflow.

This is not a headline feature, but it is the kind of detail that makes an agent workspace easier to read. Repository links are connective tissue in developer conversations. OpenClaw now keeps that tissue labeled correctly.
