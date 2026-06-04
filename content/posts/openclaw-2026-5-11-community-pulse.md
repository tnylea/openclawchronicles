---
title: "OpenClaw Community Pulse: Hermes Tops OpenRouter and the Telegram Debate"
excerpt: "Hermes Agent overtook OpenClaw as the top app on OpenRouter this week, while Hacker News debates whether Telegram is safe enough for powerful AI agents like OpenClaw."
coverImage: '/assets/images/posts/openclaw-2026-5-11-community-pulse.webp'
date: '2026-05-11T23:10:00.000Z'
dateFormatted: May 11th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-11-community-pulse.webp'
---

Two conversations are dominating the OpenClaw community today: one about competitive positioning in the AI agent space, and one about the infrastructure trust questions that come with running powerful agents over consumer messaging platforms. Here's the rundown.

## Hermes Agent Overtakes OpenClaw on OpenRouter

A [post by @joeyhage on Hacker News](https://openrouter.ai/rankings) noted that Hermes Agent has surpassed OpenClaw as the top app on the OpenRouter leaderboard. OpenRouter ranks apps by API usage volume, making it one of the more objective signals of adoption momentum in the AI agent ecosystem.

Hermes Agent is OpenClaw's closest direct competitor — a capable, actively maintained agentic platform with a growing community of its own. The shift could reflect genuine Hermes momentum from recent product updates, or it could signal that a segment of OpenClaw's power users have migrated to calling provider APIs directly rather than routing through OpenRouter. Either reading is plausible.

It's worth keeping perspective here: OpenRouter rankings fluctuate regularly, and a single snapshot doesn't define a trend. OpenClaw continues to ship aggressively (three beta releases in a single day, as of today). This is informative context, not a cause for alarm — and healthy competition generally pushes both platforms forward.

## Is Telegram Safe for Your OpenClaw Agent?

An Ask HN thread by @oger titled ["We need a safe alternative to Telegram for agents like OpenClaw or Hermes"](https://news.ycombinator.com/item?id=48093824) surfaced today with five points and some substantive discussion. The core concern is real and worth understanding clearly.

Telegram messages are **not end-to-end encrypted by default**. Standard chats — including bot API traffic — transit Telegram's servers in a form that Telegram can read. That means any API tokens, auth URLs, exec approval prompts, or sensitive content your OpenClaw agent sends or receives over Telegram is sitting on infrastructure you don't control. The poster notes WhatsApp lacks the integration surface area to be practical, and Signal would require purpose-built forks to support the kind of agentic message separation that multi-agent systems need. Meredith Whittaker, Signal's president, has also raised concerns about web-connected AI agents having access to encrypted communication channels — a relevant consideration for anyone thinking about Signal-based integrations.

OpenClaw does offer several mitigations worth knowing about: exec approvals require explicit human confirmation before shell commands run, `allowBots` settings let you restrict which bots and agents can initiate actions, and scoped tool configs limit what any given agent can do without user intervention. These are meaningful layers of defense. But they don't change the fundamental reality that Telegram itself is not a confidential transport, and if you're passing sensitive tokens or triggering high-privilege actions through it, the underlying concern @oger raises is legitimate. The OpenClaw team has not formally responded to the thread as of publication.

---

Both stories reflect a community that has moved past "does this work?" and is now asking harder infrastructure questions about security posture, transport trust, and competitive landscape. That's a healthy sign of maturity — and exactly the kind of conversation that makes the ecosystem better over time.
