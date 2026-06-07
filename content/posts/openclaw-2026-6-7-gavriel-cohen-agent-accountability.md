---
title: "OpenClaw, Gavriel Cohen, and the Agent Accountability Gap That's Coming for Everyone"
excerpt: "The NanoClaw developer found his own code inside OpenClaw without attribution or consent. His public exit and the community reaction reveal a deeper problem: autonomy in AI agents arrived before accountability did."
coverImage: '/assets/images/posts/openclaw-2026-6-7-gavriel-cohen-agent-accountability.png'
date: '2026-06-07T23:05:00.000Z'
dateFormatted: June 7th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-7-gavriel-cohen-agent-accountability.png'
---

Gavriel Cohen, the developer behind NanoClaw — a lean, security-focused alternative to OpenClaw — found his own code inside OpenClaw last week. It had been absorbed without attribution and without his consent. He didn't file a license complaint or open a pull request. He concluded that nobody was accountable for what the project had absorbed, and he left. Publicly.

The story, first reported by David Eastman at The New Stack in ["NanoClaw founder on OpenClaw's 800k lines of code, sloppiness and poor security"](https://thenewstack.io/nanoclaw-openclaw-agent-security/), became the most-read article across The New Stack's publications that week. A follow-up by Matthew Burns published yesterday, ["OpenClaw used Gavriel Cohen's code and exposed the AI Agent accountability problem"](https://thenewstack.io/openclaw-cohens-ai-agent-accountability-problem/), puts the episode in context: the real story isn't a licensing dispute. It's a preview.

## What Actually Happened

OpenClaw passed 300,000 GitHub stars the same week. It's the runtime Microsoft chose for Scout at Build 2026, and the base Nvidia is integrating with Windows Execution Containers. It is, by many measures, the most important open-source agent project in existence right now.

And a working developer's code ended up inside it, and nobody could say who put it there, when, or under what terms.

Cohen's response, as Burns observes, matters precisely because of what it wasn't. Not a license complaint. Not a settlement demand. Not a PR. He looked at a tool he had unknowingly helped build, concluded that the accountability chain was broken, and walked away. Thousands of developers read that story and immediately asked the same question: is my code in there too?

## Autonomy Without Accountability

Burns frames the episode alongside two other stories that landed the same week to make a structural argument. Aikido Security found that AI coding agents, given the autonomy to manage their own dependencies, are installing packages that nobody owns. The headline from that research: "There is no accountability." Linus Torvalds, in a widely covered exchange, expressed anger at claims that "99% of code is AI" — not because he's anti-AI, but because generated code erases the author, and authorship is what creates accountability.

Anthropic's own research landed in the same week: Claude now writes more than 80% of the code the company merges. One Anthropic employee is five months past the last line they wrote by hand.

"Generated isn't the same as authored," Burns writes. "Authorship is what creates accountability: someone who can say what the code does, why it's there, and who fixes what breaks."

This isn't an argument against AI agents or against OpenClaw. The agents work. They're doing exactly what they were built to do — act autonomously — inside an ecosystem that hasn't yet decided who owns the consequences.

## The Market Is Starting to Price This In

The accountability gap is creating opportunities. JetBrains open-sourced Mellum2, its coding model, specifically so it can run on enterprise codebases that can't leave the building — code that legal or compliance keeps off someone else's cloud. The pitch isn't that Mellum2 out-thinks Claude. The pitch is that it's a model you can inspect, run on your own hardware, and answer for. Accountability as a product feature.

Meanwhile, Google moved in the opposite direction, pushing users off the open-source Gemini CLI and onto its closed-source Antigravity CLI — the same week OpenClaw passed 300,000 stars. The contrast between the two moves didn't go unnoticed.

## What This Means for OpenClaw

For the OpenClaw community, the Cohen episode is a moment of reckoning that doesn't require anyone to have acted with bad intent. The project grew fast, absorbed contributions from a wide range of sources, and the attribution trails got messy. That's not a scandal. It's what happens when a weekend project becomes foundational infrastructure in six months.

The meaningful response isn't defensiveness. It's the kind of governance work that OpenClaw has actually been investing in: the [operator install policy that replaced the dangerous-code scanner](https://github.com/openclaw/openclaw/pull/89516) in the recent 2026.6.2 release, the Skill Workshop's [review-and-approval flow for proposed skills](https://github.com/openclaw/openclaw/pull/88734), and Microsoft's decision to contribute enterprise policy conformance work back upstream.

None of that undoes what Cohen experienced. But it points toward a project that is trying to build accountability into the layer below autonomy — which is the right order.

The alternative is more developers walking away and more stories about code that ended up somewhere nobody expected.

---

*Sources: [The New Stack](https://thenewstack.io/openclaw-cohens-ai-agent-accountability-problem/) (Matthew Burns, June 6, 2026); [The New Stack](https://thenewstack.io/nanoclaw-openclaw-agent-security/) (David Eastman, June 4, 2026).*
