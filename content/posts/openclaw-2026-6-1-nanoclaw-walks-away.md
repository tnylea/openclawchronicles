---
title: "NanoClaw Founder Found His Own Package in OpenClaw — and Walked Away"
excerpt: "Gavriel Cohen spotted his obscure NanoPDF package in OpenClaw's installer and saw all his WhatsApp logs. So he built NanoClaw: a security-first, 25-line minimal alternative."
coverImage: '/assets/images/posts/openclaw-2026-6-1-nanoclaw-walks-away.webp'
date: '2026-06-01T23:05:00.000Z'
dateFormatted: June 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-1-nanoclaw-walks-away.webp'
---

A story from The New Stack is making the rounds today, and it's the kind of thing that sticks with you.

[Gavriel Cohen](https://www.linkedin.com/in/gavrielco/), founder of [NanoClaw](https://nanoclaw.dev/) and [NanoCo AI](https://nanoco.ai/), was an early OpenClaw adopter. He came to it the way a lot of people do — through Claude Code, a sudden impulse to start building again, and the appeal of connecting an AI agent to WhatsApp for a marketing agency he was running. Then things got strange fast.

## He Saw His Own Package in the Installer

"I was going through the setup that gives you all these options for different packages to install," Cohen told [The New Stack](https://thenewstack.io/nanoclaw-openclaw-agent-security/), "and one of them was a package that I had built a few months before called NanoPDF. I saw that and thought, 'Why did they include that tiny package?'"

NanoPDF had a few stars on GitHub and hadn't been updated in months. Seeing it surface in an AI agent installer — recommended alongside well-known packages — wasn't flattering. It was alarming. It meant OpenClaw's skill recommendation layer wasn't curating based on quality or security track record. It was pulling in obscure packages that nobody had vetted.

That was day one. Then came day two.

## All the WhatsApp Logs

"Then in the first day or two I was debugging, after a scheduled job didn't fire, and I saw the logs of all the WhatsApp messages — not just the one group that I connected it to, but all of them."

This is where Cohen's concern shifted from "this is sloppy" to "this project is not safe for business use." He wasn't just seeing unexpected behavior — he was seeing data he hadn't consented to expose. For a developer running an AI agent connected to customer communications, that's disqualifying.

## The Half-Million-Line Verdict

What came next wasn't a bug report or a pull request. Cohen looked at the codebase.

"I looked at the code base, and it's like a half a million lines of code."

He repeats this point multiple times in the interview, and it's worth understanding why. It's not about elegance or preference for small codebases. His argument is simpler: past a certain size, **open source security guarantees break down**. There aren't enough eyes. The audit surface is too large. You can enforce sharper coding standards and change policies, but you can't un-grow a codebase that's already out of control. At the time of his decision, OpenClaw had over 3,000 open pull requests. Today it has over 800,000 lines of code.

"I think it was fundamentally flawed from the beginning," Cohen said, "and the fatal flaw is half a million lines of code."

## So He Built Something Else

Cohen sat down and wrote NanoClaw. The architecture, in his telling, is deceptively simple: a persistent environment session (for running code and Bash), a messaging channel connection, access to the internet, and a scheduling layer. "From those four fundamental capabilities you can build out everything else," he said. "You can write a claw agent in as little as 25 lines."

The security model is built around **containers** — an architectural choice that both constrains what the agent can access and makes the security guarantees legible. The entire codebase is small enough to review. NanoClaw is shipped from source, not as a binary, because Cohen wants users to be able to read what they're running.

He's honest about the tradeoffs. NanoClaw is still primarily for technical users. The setup process involves a terminal and GitHub. And having Claude in the loop for installation help introduces its own risks: "If you don't understand the security model and you're just running Claude, it can break the security model or remove the sandboxing."

## Why This Story Matters

Cohen's critique doesn't aim at any particular version of OpenClaw. It's structural. His argument is that once an AI agent becomes the primary interface between a person and their communications, files, and automations — the security model needs to be auditable at the code level. Not just claimed in a README. Not just asserted by a maintainer. Actually readable.

NanoClaw is his answer to that. It's a minority position in a space dominated by do-everything platforms, but it's a coherent one. And the fact that it started with a developer recognizing his own obscure package in someone else's installer is the kind of origin story that tends to stay relevant.

The full interview is at [The New Stack](https://thenewstack.io/nanoclaw-openclaw-agent-security/). Worth reading in full.
