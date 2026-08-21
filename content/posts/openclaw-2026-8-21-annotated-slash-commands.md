---
title: "OpenClaw Keeps Annotated Slash Commands Local"
excerpt: "OpenClaw Control UI now routes annotated slash commands from the raw draft, preventing browser annotations from becoming model input."
coverImage: '/assets/images/posts/openclaw-2026-8-21-annotated-slash-commands.png'
date: '2026-08-21T23:03:00.000Z'
dateFormatted: August 21st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-21-annotated-slash-commands.png'
---

OpenClaw merged a Control UI command-routing fix tonight: [PR #121191](https://github.com/openclaw/openclaw/pull/121191) keeps annotated slash commands local.

The bug was subtle. Browser annotations were composed into a message before slash-command classification. If an operator staged a screenshot annotation and then typed a recognized command such as `/new`, `/stop`, or a remote command like `/status`, the composed annotation text could hide the command. Instead of being handled as a command, it could be sent as ordinary model input.

That is not just confusing. It crosses a user-intent boundary. A command like `/stop` should interrupt the current run, not become content for the assistant to interpret.

## The Raw Draft Now Wins

The fix changes the Control UI submission and composer-recovery boundaries. OpenClaw now classifies the raw operator draft once. If the draft is a recognized command, OpenClaw retains the raw command text and dispatches it through the command path.

Annotation context is composed only for actual model input. That means ordinary annotated prompts still carry their screenshot context, while real commands remain commands.

The PR also tightens composer recovery for mixed attachments. Failed mixed-attachment drafts are restored only while the exact submitted annotation object still owns the composer. That protects against races where a later annotation with the same-looking state should not inherit an older recovery path.

## What This Fix Covers

The user-facing behavior is easy to summarize:

- Annotated `/new` creates a new session instead of sending annotation text to the model.
- Annotated `/stop` interrupts the active run instead of becoming a prompt.
- Recognized remote commands such as `/status` follow the command route.
- Ordinary annotated prompts still include their annotation context.
- Unknown slash-prefixed text can still be treated as model input when it is not a recognized command.

This is the right split. An annotation should enrich a prompt, not rewrite the meaning of a command.

## Why It Matters

Control UI browser annotations are built for rich context: screenshots, marked pages, document bytes, and related context cards. Slash commands are built for direct control: create a session, stop work, export, approve, ask for status, or switch into a side thread.

When those two systems meet, command intent has to be classified before prompt enrichment. Otherwise a rich context feature can accidentally make control actions less deterministic.

[PR #121191](https://github.com/openclaw/openclaw/pull/121191) moves that decision to the raw draft, which is the operator's clearest statement of intent.

## Validation

The regression evidence is strong. Before the fix, the focused test showed annotated `/new` failing to call `sessions.create`, annotated `/stop` calling `chat.send` instead of `chat.abort`, and annotated `/status` being sent with annotation text.

After the fix, final-head validation covered chat submission, run lifecycle, command routing, and composer recovery. The PR reports 364 owner and sibling tests passing, plus 17 Chromium, Vite, and mock-Gateway checks.

The mounted Control UI proof showed the annotation card accepted before raw commands, then verified that `/new` created a session and `/stop` interrupted the run without model delivery. Formatting, source syntax checks, CI, and workflow sanity checks also passed.

## Bottom Line

[PR #121191](https://github.com/openclaw/openclaw/pull/121191) makes a user-intent boundary more predictable. If you attach browser context and type a real slash command, OpenClaw now treats the command as the command.

That keeps Control UI annotations useful without letting them blur local control actions into ordinary model prompts.
