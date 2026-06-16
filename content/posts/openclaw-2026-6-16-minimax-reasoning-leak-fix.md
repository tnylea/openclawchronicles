---
title: "OpenClaw Fixes MiniMax Reasoning Leak in Chat"
excerpt: "OpenClaw PR #93767 strips MiniMax mm: reasoning tags so hidden chain-of-thought content no longer reaches visible Telegram chat output."
coverImage: '/assets/images/posts/openclaw-2026-6-16-minimax-reasoning-leak-fix.png'
date: '2026-06-16T23:01:00.000Z'
dateFormatted: June 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-16-minimax-reasoning-leak-fix.png'
---

OpenClaw merged a focused privacy fix late Tuesday: [PR #93767](https://github.com/openclaw/openclaw/pull/93767) teaches the shared reasoning-tag sanitizer and Telegram reasoning-lane coordinator to recognize MiniMax's `mm:` namespaced thinking tags.

The issue was direct. MiniMax M3, including when served through Fireworks, can emit reasoning inline in the content stream inside tags such as `<mm:think>`. OpenClaw already stripped plain thinking tags and Anthropic-style namespaced tags, but the quick detector did not recognize the MiniMax namespace. When that guard missed the tag, the sanitizer returned the content unchanged, letting hidden reasoning reach visible chat output.

## Why This Is Security-Relevant

Reasoning leakage is not just cosmetic. Hidden model reasoning can include private instructions, task strategy, intermediate assumptions, sensitive context summaries, or snippets that should never become part of a public reply. If an agent is connected to Telegram, Slack, Discord, or another chat channel, a sanitizer miss can turn an internal model artifact into a user-visible message.

PR #93767 focuses on the path that produces that visible leak. It updates the shared `reasoning-tags.ts` sanitizer and the Telegram reasoning-lane coordinator so `mm:` is accepted alongside the existing supported prefixes.

The merged patch is small: 53 additions, 6 deletions, and 9 changed files. The important part is behavioral, not size. The proof in the PR compares the shipped sanitizer artifact before and after the patch using the same MiniMax-style payload. Before the fix, the entire reasoning block remained in the output. After the fix, only the final answer text remained.

## What Changed

The sanitizer now recognizes MiniMax namespaced variants for think, thinking, and thought blocks. The tests cover closed tags, truncated open tags, orphan-close recovery, and code-fence preservation so normal code examples do not get mangled while real reasoning wrappers are stripped.

Telegram gets an explicit update too because channel delivery has its own reasoning-lane coordination path. That matters for OpenClaw because Telegram is one of the most common surfaces for always-on personal agents. Fixing only a generic text helper would not be enough if the channel-specific path still had a narrower tag list.

## What Remains To Watch

The PR notes related duplicated tag handling in a few other areas, including progress-draft and monitor paths. The merged fix addresses the two paths tied to the user-visible leak, but the follow-up lesson is bigger: reasoning tag names should probably live in one shared constant rather than being copied across delivery paths.

That is especially true as more providers ship model-specific thinking formats. OpenClaw's provider support is expanding quickly, and every provider-specific output convention becomes part of the agent's safety boundary once responses are bridged into chat.

## Operator Takeaway

If you run MiniMax M3 or Fireworks-hosted MiniMax through OpenClaw with reasoning enabled, track this patch closely. Older builds can allow `mm:` reasoning wrappers to appear in visible chat. The fix is merged on main, and it should be treated as a privacy hardening item for chat-connected deployments.

Read the merged fix: [OpenClaw PR #93767](https://github.com/openclaw/openclaw/pull/93767).
