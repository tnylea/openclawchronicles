---
title: "OpenClaw Web Client: A Full Browser UI for Managing Your Agents"
excerpt: "A new open-source web client for OpenClaw gives you a polished chat interface with multi-agent support, file uploads, streaming, and PWA install."
coverImage: '/assets/images/posts/openclaw-2026-4-27-web-client-browser-ui.png'
date: '2026-04-27T23:05:00.000Z'
dateFormatted: April 27th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-27-web-client-browser-ui.png'
---

If you have ever wanted a proper web UI for your OpenClaw agents — something beyond the CLI and the built-in Gateway chat — **[openclaw_client](https://github.com/lotsoftick/openclaw_client)** by GitHub user `lotsoftick` is worth a look. It launched today on Hacker News as a Show HN and packages a full-featured React frontend with an Express API backend into a single `npm start` command.

## What It Is

OpenClaw Web Client is a self-hosted browser interface for OpenClaw. It runs a lightweight Node.js API server alongside a React + Vite frontend, both installed to `~/.openclaw_client` via the setup script. A single command handles the build, deploy, and OS-level auto-start:

```bash
git clone https://github.com/lotsoftick/openclaw_client.git
cd openclaw_client
npm start
```

After that, the client is available at `http://localhost:18800` and the API at `http://localhost:18802`.

## Key Features

**Multi-agent management** — The sidebar lets you create and switch between multiple OpenClaw agents, each with its own model selection, persona, and isolated conversation history.

**Streaming responses** — Replies stream in real time with a separate display panel for the thinking process and final output — useful when debugging agent reasoning.

**File uploads** — Attach files directly to messages; they land in the agent's workspace directory automatically, giving the agent file context without manual copying.

**14 color themes** — A sidebar theme picker with 14 built-in options. Frivolous? Maybe. But nice.

**Installable PWA** — Chrome, Edge, Brave, Arc, and Opera all detect the app as installable. One click puts it in your dock or taskbar as a standalone window. Safari supports "Add to Home Screen" on iOS and macOS.

## Tech Stack

- **Frontend**: React 19, Vite, Material UI, Redux Toolkit Query, organized with Feature-Sliced Design
- **Backend**: Express + TypeScript + TypeORM + SQLite
- **Auth**: JWT with a default admin account on first run
- **IPC**: The Express API proxies OpenClaw CLI execution using `node-pty` (ConPTY on Windows)

Windows is fully supported — it requires Git for Windows and Visual Studio Build Tools for native modules, but the README covers the setup clearly.

## Port Configuration

Ports live in `~/.openclaw_client/.env` and default to 18800 (UI) and 18802 (API). Both the dev Vite server and the production static server read the same file, so changing a port just requires editing one line and running `openclaw_client restart`.

## CORS and Remote Access

The default config allows every origin, which makes the same install work over localhost, LAN, and Tailscale without extra steps. To lock it down, set `ALLOWED_DOMAIN` and `OPENCLAW_STRICT_CORS=1` in `~/.openclaw_client/api/.env`.

## Getting Started

Prerequisites: Node.js 18+ and an authenticated OpenClaw CLI install (`openclaw auth status` should pass).

```bash
git clone https://github.com/lotsoftick/openclaw_client.git
cd openclaw_client
npm start
# open http://localhost:18800
# login: admin@admin.com / 123456 (change immediately)
```

The `openclaw_client` global command handles start, stop, restart, status, and uninstall from any directory after the initial `npm start` setup. The project is early but functional — the README is thorough and the architecture is clean. Worth bookmarking if you manage multiple agents and want a GUI to go with your CLI.

Source: [github.com/lotsoftick/openclaw_client](https://github.com/lotsoftick/openclaw_client)
