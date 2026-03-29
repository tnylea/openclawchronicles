---
title: "OpenClaw Skills Got a Proper UX: One-Click Install Is Here"
excerpt: "OpenClaw v2026.3.25 transforms skill management with one-click installs, a redesigned Control UI, and clearer API key guidance for seven bundled skills."
coverImage: '/assets/images/posts/openclaw-2026-3-25-skills-ux.png'
date: '2026-03-25T16:35:00.000Z'
dateFormatted: March 25th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-3-25-skills-ux.png'
url: '/posts/openclaw-2026-3-25-skills-ux/'
---

One of the persistent friction points in OpenClaw has been skill setup. You install a skill, it needs Python dependencies, or an API key, or some runtime package — and you're left hunting through documentation to figure out what's missing. **v2026.3.25 fixes this** with a skills UX overhaul across the CLI, Control UI, and macOS app.

## One-Click Install Recipes

Seven bundled skills now ship with **install recipes** ([PR #53411](https://github.com/openclaw/openclaw/pull/53411), contributed by [@BunsDev](https://github.com/BunsDev)):

- `coding-agent`
- `gh-issues`
- `openai-whisper-api`
- `session-logs`
- `tmux`
- `trello`
- `weather`

When a skill has unmet requirements, both the CLI and the Control UI can now detect them and offer to install the dependencies directly. Instead of a cryptic error at runtime, you get a prompt: "This skill needs X. Install now?"

## Control UI: Status Filters and Detail Dialogs

The skills page in the Control UI gets a meaningful redesign:

**Status-filter tabs** replace the flat list with tabbed views:
- All
- Ready
- Needs Setup
- Disabled

Each tab shows a count, so at a glance you know how many skills are ready vs. waiting for configuration.

**Click-to-detail dialogs** replace the old inline skill cards. Click a skill and you get a full panel with:

- Requirements list with install status
- Toggle switch (enable/disable without leaving the dialog)
- One-click install action for missing dependencies
- API key entry field
- Source metadata (origin, version, publisher)
- Homepage link

This is a much more useful experience than the previous "card on a list" approach, especially as skill libraries grow.

## CLI: "Needs Setup" and API Key Guidance

The CLI gets two improvements from the same PR:

**Label softening:** The missing-requirements label changes from `missing` to `needs setup`. It's a minor copy change, but it communicates the right thing — the skill exists and is valid, it just needs configuration.

**API key guidance in `openclaw skills info`:** The output now surfaces:
- Where to get a key (homepage link)
- The CLI command to save a key
- The storage path where the key will be saved

No more hunting through docs to find the right environment variable or config field.

## macOS App: API Key Editor Improvements

The macOS app's API key editor dialog gains the same improvements: a "Get your key" homepage link and a storage-path hint. Save confirmation messages now also show the config path so you know exactly where the credential was written.

## Why This Matters for ClawHub Skills

These changes land alongside the broader [ClawHub integration work](https://github.com/openclaw/openclaw/releases/tag/v2026.3.22) from the previous stable release. As the ClawHub skill ecosystem grows, install UX becomes increasingly important — you shouldn't need to read a skill's README to get it working.

The combination of one-click install recipes, the redesigned Control UI, and clearer CLI output makes skills feel like a first-class feature rather than a power-user afterthought.

## Workspace File Preview

One more Control UI improvement worth noting: agent workspace file rows are now expandable with **lazy-loaded inline markdown preview** ([PR #53411](https://github.com/openclaw/openclaw/pull/53411)). The preview dialog uses `@create-markdown/preview v2` with system theme detection, rendering headings, tables, code blocks, callouts, and blockquotes in a frosted backdrop panel.

If you manage agents with complex workspace files (SOUL.md, MEMORY.md, TOOLS.md), being able to preview them directly in the Control UI without switching to a file browser is a quality-of-life win.

---

Install or update via `npm install -g openclaw@latest` or `openclaw update`. Skills documentation lives at [docs.openclaw.ai/tools/clawhub](https://docs.openclaw.ai/tools/clawhub).
