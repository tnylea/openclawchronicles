---
title: "OpenClaw Sends Scanned PDFs to Vision Models"
excerpt: "OpenClaw now forwards rendered scanned PDF pages into chat vision pipelines, fixing a silent drop for image-only document attachments."
coverImage: '/assets/images/posts/openclaw-2026-6-28-scanned-pdf-vision-models.png'
date: '2026-06-28T08:02:00.000Z'
dateFormatted: June 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-28-scanned-pdf-vision-models.png'
---

OpenClaw merged a document-understanding fix that makes scanned PDFs useful in chat-channel replies again. [PR #97354](https://github.com/openclaw/openclaw/pull/97354), merged June 28 at 04:01 UTC, forwards rendered PDF page images into the normal reply image pipeline for vision-capable models.

The issue affected scanned or image-only PDFs. OpenClaw could render PDF pages through media understanding, but those rendered page images were silently dropped before the reply model saw them. For a PDF with no extractable text, that meant the model could miss the actual document content.

## What Changed

Rendered PDF page images now flow into the same image path used by current-turn chat media. The PR says the change preserves attachment ordering across described media, rendered file pages, and native images in the same turn.

The behavior also applies to the ACP dispatch path, which keeps agent-to-agent or app-protocol workflows aligned with ordinary chat-channel replies.

OpenClaw removed the stale placeholder that told users rendered PDF images were not forwarded. Local PDF extraction now also honors the existing input-file timeout limit, reducing the chance that a stalled extraction path hangs indefinitely.

## Why It Matters

Scanned PDFs are everywhere: leases, receipts, signed forms, invoices, legal packets, onboarding documents, and exported scans from mobile apps. Many of those files contain little or no machine-readable text. For agents, the rendered page image is the document.

With this fix, operators can expect better behavior when asking OpenClaw to inspect image-only PDFs:

- Rendered PDF pages reach vision-capable reply models.
- Attachment ordering is preserved across mixed media.
- ACP dispatch receives the same PDF page image behavior.
- Stalled local extraction respects timeout limits.
- The runtime output no longer implies that rendered images are unavailable.

This is especially useful for mobile and chat-first workflows. A user can drop a scanned PDF into a conversation and ask for a summary, extraction, or sanity check without first converting the document into separate images.

## Validation

The PR included a strong proof set. Focused Vitest coverage passed across reply hooks, media fetch guards, PDF extraction, document extraction, media understanding, current-turn images, agent-runner media paths, and ACP dispatch. The author reported 281 tests across five Vitest shards.

There was also live Telegram proof using a real Telegram credential. The test sent a scanned PDF through Telegram and observed one image input reaching the reply pipeline. A separate Linux extraction proof confirmed rendered PDF fallback produced an image count of one and removed the stale "images not forwarded" placeholder.

For OpenClaw users, this closes an annoying gap between document rendering and model input. Scanned PDF pages should now actually reach the vision model that can read them.

