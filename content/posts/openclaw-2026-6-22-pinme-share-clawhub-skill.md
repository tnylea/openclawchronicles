---
title: "OpenClaw ClawHub Adds PinMe Share Skill"
excerpt: "OpenClaw users now have a PinMe Share skill for uploading files or directories to public IPFS links with explicit privacy warnings."
coverImage: '/assets/images/posts/openclaw-2026-6-22-pinme-share-clawhub-skill.png'
date: '2026-06-22T08:03:00.000Z'
dateFormatted: June 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-22-pinme-share-clawhub-skill.png'
---

ClawHub has a fresh utility skill worth noting: [PinMe Share](https://clawhub.com) appeared in the Tier 1 skill feed with version 1.0.0, offering OpenClaw agents a repeatable way to upload a local file or directory to PinMe and return a short public URL.

The skill is deliberately straightforward. Its summary says it can upload "any local file or directory" and return a `*.pinit.eth.limo` link. The supported cases include HTML pages, PDFs, images, audio, video, documents, and whole directories.

That makes PinMe Share a practical fit for the growing class of OpenClaw workflows that produce artifacts rather than just chat replies. Think generated reports, one-off HTML previews, static bundles, media exports, or directories of deliverables that need to be handed to someone outside the agent workspace.

## What The Skill Does

According to the ClawHub metadata, PinMe Share handles:

- Uploading single files.
- Uploading whole directories.
- Returning short shareable public links.
- Viewing upload history.
- Unpinning content.
- Checking wallet or quota state.
- Logging out.

It also outputs machine-readable JSON to stdout, with warnings and errors sent to stderr. That is a small but useful design choice for agent workflows because it lets another script or tool consume the resulting URL cleanly without scraping terminal prose.

The skill stores the PinMe AppKey in an XDG-style config path at `~/.local/share/pinme-share/appkey.json`, with overrides through `PINME_APPKEY` or a CLI setup command. That keeps setup explicit while still making repeated uploads scriptable.

## The Privacy Boundary Is The Story

The most important detail is the warning. PinMe uses public IPFS. Uploaded content is publicly accessible, and the skill explicitly tells users not to upload private, internal, or credential-bearing data.

That warning is not boilerplate. OpenClaw agents often work in directories that contain secrets, unpublished code, private business files, or local scratch artifacts. A sharing skill needs to make the public boundary impossible to miss.

PinMe Share does that in its description and release notes. It frames the tool as useful for phrases like "upload this file," "host this page," "give me a public link," or "upload to IPFS," but it also states the public-data rule up front.

## Why It Matters For ClawHub

PinMe Share is not a headline infrastructure release, but it shows how ClawHub is filling everyday workflow gaps. OpenClaw agents already write files, generate pages, create images, package reports, and assemble directories. A clean publish-and-share primitive turns those outputs into something a human can inspect without SSH, screenshots, or manual copy steps.

The open question is adoption. The skill is brand new, with no installs or stars at the time of the morning scan. But the use case is clear, the privacy boundary is explicit, and the command surface looks automation-friendly.

For now, PinMe Share belongs in the useful utility category: not a replacement for private storage or authenticated document sharing, but a handy public-link path when the content is intentionally shareable.
