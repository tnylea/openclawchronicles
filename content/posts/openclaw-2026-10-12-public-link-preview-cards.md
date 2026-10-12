---
title: "OpenClaw Public Links Get Session-Specific Cards"
excerpt: "OpenClaw PR #169527 adds session-specific public link preview cards with bounded redaction, work facts, revocation fallbacks, and cached PNG rendering."
coverImage: '/assets/images/posts/openclaw-2026-10-12-public-link-preview-cards.png'
date: '2026-10-12T08:06:00.000Z'
dateFormatted: October 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-12-public-link-preview-cards.png'
---

[PR #169527](https://github.com/openclaw/openclaw/pull/169527) gives OpenClaw public session links a more useful first impression: instead of every shared conversation unfurling with the same generic card, public sessions can now render preview images specific to the shared content.

The change is small in concept but broad in execution. Link previews are one of those surfaces that look like polish until you remember where they appear: Slack, Discord, messaging apps, social feeds, issue comments, docs, and internal team threads. A meaningful card can tell readers what they are about to open before they click.

## What the Cards Show

Public sessions now get a 1200 by 630 preview with the session title, opening public request, and available session facts. If a worktree already has recorded change counts, the card can become a work receipt with branch information, diff totals, and recorded PR or check state.

Private, unknown, revoked, and unavailable publications keep the generic card. That fallback is important because unfurls are copied, cached, and displayed in places OpenClaw does not control. The PR notes that successful previews may be cached for five minutes, and revocation cannot recall copies a recipient has already downloaded.

## Redaction Stays at the Center

The preview route uses the existing opaque share-token contract and shares the public page's admission, secure-ingress, current-publication checks, redaction, and bounded representation cache.

The content boundary is intentionally narrow. Cards expose only public conversation text and permitted display or recorded work facts. They omit owner identities, email addresses, costs, model names, internal paths, and unknown fields. Cold worktree snapshots do not trigger fresh Git or GitHub reads just to render an unfurl.

That matters because preview cards are easy to underestimate. They are generated automatically, often by third-party clients, and can spread outside the original browser session. The right default is to make the preview helpful while treating it as a public artifact.

## Rendering Moves Off the Gateway Thread

The implementation adds a pinned runtime dependency, `@resvg/resvg-js@2.6.2`, for font-aware SVG rasterization. Rasterization and font measurement run in a lifecycle-owned worker, so the Gateway boot path does not load the renderer.

The PR also bundles byte-verified OFL font files and license notices from Google Fonts sources, with maintainer-approved provenance review recorded separately. That is a lot of detail for preview cards, but it explains why the rendered output can be deterministic without pulling rendering work into the hot Gateway path.

## The Safety Tests Are the Story

The proof section focuses on boundary behavior. A real loopback HTTP test covers document and PNG delivery, caching, private and revoked fallbacks, and a paused-render revocation case. Public reader tests cover oversized transcript rows and private or assistant preludes, while renderer tests check escaping, length caps, line placement, fallback behavior, metadata, and cache invalidation.

This is a user-facing feature, but the interesting part is the restraint. OpenClaw public links now get richer cards, yet the implementation keeps the preview tied to the same admission and redaction model as the public page. That is the right shape for sharing agent work in places where a link preview may travel farther than the original conversation.

