---
title: "NanoClaw Founder: OpenClaw's 800K Lines Is a Fatal Flaw"
excerpt: "NanoClaw creator Gavriel Cohen tells The New Stack why he walked away from OpenClaw — and why codebase size is the most important security signal nobody talks about."
coverImage: '/assets/images/posts/openclaw-2026-6-4-nanoclaw-founder-security-critique.png'
date: '2026-06-04T23:05:00.000Z'
dateFormatted: June 4th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-4-nanoclaw-founder-security-critique.png'
---

Gavriel Cohen came to OpenClaw as a believer. He left as a founder — and the critique he took with him is one of the most substantive security arguments the OpenClaw ecosystem has produced.

In a [new interview with David Eastman at The New Stack](https://thenewstack.io/nanoclaw-openclaw-agent-security/), Cohen — a former Wix developer who now runs [NanoClaw](https://nanoclaw.dev/) and [NanoCo AI](https://nanoco.ai/) — walks through exactly what he found, what it told him, and why he concluded that the problem wasn't fixable.

## Two Red Flags in the First Few Days

Cohen's first warning came from OpenClaw's own install recommendations. During setup, he noticed one of the suggested packages was **NanoPDF** — a package he himself had built months earlier, which had barely a handful of GitHub stars and hadn't been updated in months.

"Why did they include that tiny package?" he remembers thinking. A personal assistant framework recommending obscure, unmaintained packages to its users isn't just a quality problem — it's a trust problem. Package recommendations carry implicit endorsement. When that endorsement breaks down, users have no reliable signal for what's safe to install.

The second issue surfaced within a day or two, during a debugging session on a scheduled job that hadn't fired. Cohen found himself looking at WhatsApp message logs — not just from the group he had connected to OpenClaw, but **all of his WhatsApp groups**.

That's the kind of quiet data exposure that doesn't show up as an error. It doesn't crash anything. It just sits there, and most users would never notice it.

## The Code Mountain Nobody Can Climb

Both red flags pointed Cohen toward the same underlying diagnosis: OpenClaw's codebase is too large for anyone to fully audit.

"I looked at the code base, and it's like a half a million lines of code," he told The New Stack. By the time of this interview, that number had grown to over **800,000 lines**. For context: when OpenClaw had 3,000+ pull requests queued and over 800K lines in the tree, even the most dedicated security researcher can only review a fraction of it. The surface area is simply too wide.

"You can change policies or enforce sharper coding standards," Cohen notes, "but once a project's code base grows out of control into an unmaintainable mess, the project is over."

This is a meaningful critique. It's not that OpenClaw is malicious — it's that the codebase has grown faster than anyone's ability to understand what it's doing. In security terms, that's functionally the same as having no security model. The best policies in the world can't protect a system you can't inspect.

## The NanoClaw Alternative

Cohen's response was to build from scratch, with a different constraint from day one: the core had to stay small enough to audit.

"I sat down to build NanoClaw," he explains. "I had to make this super small because in order for anybody who cares about security to use it, they're going to have to be able to look over the code and actually see what's going on."

The result is a system where Cohen can describe the architectural core in four capabilities:

1. A coding agent that can write code and run Bash commands
2. A persistent environment session
3. Messaging app connectivity
4. Internet access

"From those 4 fundamental capabilities you can build out everything else," Cohen says. "You can write a claw agent in as little as 25 lines."

NanoClaw ships with containers for isolation — a deliberate architectural choice. Cohen explains that sandboxing is one of the few security properties that holds up even when users don't fully understand the security model. Without it, installing NanoClaw via Claude (which the setup process involves) risks breaking the very sandboxing that makes it trustworthy.

## The Acquisition That Didn't Fix Things

One detail in the interview that deserves attention: Cohen observes that OpenClaw's usability and community challenges persisted even after OpenAI's acquisition. The acquisition brought resources and visibility, but the fundamental problem — 800,000 lines of code that nobody fully controls — isn't something a corporate parent can fix by writing a larger check.

## What This Critique Actually Tells Us

The NanoClaw fork isn't a competing product in the traditional sense. Cohen's audience is explicitly "technical people — not necessarily developers, but those comfortable with the terminal and GitHub." He's not trying to serve the same market as HolaClaw or the mainstream small-business users the *Times* profiled this week.

But the critique he's making applies to anyone trying to build a business or ship a product on top of OpenClaw. If your threat model includes "what happens when a dependency I didn't audit does something unexpected?" — and for most people doing real work, that threat model is correct — then codebase size matters.

NanoClaw is currently [available on GitHub](https://nanoclaw.dev/) for technically-minded users who want an auditable alternative. It won't replace OpenClaw for the people who need Workboard, ClawHub skills, and a full channel ecosystem. But it asks a question that the OpenClaw community is increasingly being asked to answer: how much code is too much code?

**Source:** ["Gavriel Cohen found his own code inside OpenClaw, so he walked away" — The New Stack](https://thenewstack.io/nanoclaw-openclaw-agent-security/) by David Eastman
