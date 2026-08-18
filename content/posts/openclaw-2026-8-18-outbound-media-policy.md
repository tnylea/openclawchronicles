---
title: "OpenClaw Tightens Outbound Media File Policy"
excerpt: "OpenClaw now applies sender-scoped file-read policy to outbound attachments, closing a sensitive media access gap in final replies."
coverImage: '/assets/images/posts/openclaw-2026-8-18-outbound-media-policy.png'
date: '2026-08-18T23:01:00.000Z'
dateFormatted: August 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-18-outbound-media-policy.png'
---

OpenClaw merged a high-priority media security fix in [PR #125950](https://github.com/openclaw/openclaw/pull/125950), making sender-scoped file-read restrictions apply consistently to outbound attachments.

The issue was subtle but important. Operators could configure global or per-agent `toolsBySender` rules to deny file reads, and ordinary tool access would respect that policy. But a model-selected local file could still be attached through final replies or message actions.

That made outbound media a policy boundary, not just a convenience feature. If a sender is not allowed to read a local file, OpenClaw also has to prevent that sender from receiving the same file as an attachment.

## What Changed

The merged change moves outbound media access onto the same canonical requester policy used by ordinary tools before local-file access is granted. In practical terms, a denied requester keeps access only to established managed-artifact roots, while legitimate workspace-only attachments continue to work.

The PR also keeps the source session authoritative for channel-qualified rules. That matters for multi-channel and multi-agent deployments because sender policy can depend on the channel identity that initiated the request.

Message-action capabilities now carry the supported sender aliases minted by the host, so policy evaluation has the same identity context whether the file is sent in a final reply or through an explicit message action.

## Why It Matters

OpenClaw agents often bridge private workspaces, channel conversations, generated media, and local files. Operators may intentionally let an agent send generated artifacts while blocking some users or channels from reading arbitrary workspace files.

Before this fix, the PR says a focused probe showed ordinary read access denied while outbound media still exposed a reader and expanded the selected file's parent directory. Review then found a second route: when a custom reader was absent, fallback direct reads could still reach retained baseline roots.

That is exactly the kind of edge path security-sensitive systems need to close. The visible product action is "attach a file," but the underlying question is still whether that requester is allowed to read the bytes.

## User Impact

Operators using sender-scoped file-read restrictions should now see those restrictions enforced across outbound attachments as well as ordinary tools. Allowed senders, workspace-only workflows, and managed generated media continue to work normally.

The fix does not describe a configuration or protocol change. It is a policy-enforcement repair in the Gateway and media path, aimed at making existing rules mean the same thing everywhere file bytes can leave the system.

## Evidence From The PR

The PR reports focused media, capability, recovery, and message-tool suites, plus sibling suites covering final replies, delivery, message actions, matchers, managed paths, and requester policy. In total, those sibling suites included 289 passing tests.

It also reports `pnpm check:changed` with core and core-test typechecking, lint, import-cycle, policy, and database guards, plus a clean diff-scoped autoreview. The regression proof specifically checks that a denied workspace file is rejected without disclosing bytes while a managed tool artifact remains loadable.
