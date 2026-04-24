---
title: "OpenClaw Community: PrivateClaw TEEs and the Lilo Personal OS"
excerpt: "Two notable Show HN launches this week: PrivateClaw runs OpenClaw agents in AMD SEV-SNP confidential VMs, while Lilo builds a full personal OS on top."
coverImage: '/assets/images/posts/openclaw-2026-4-24-community-privateclaw-lilo.png'
date: '2026-04-24T23:10:00.000Z'
dateFormatted: April 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-24-community-privateclaw-lilo.png'
---

Two interesting projects inspired by OpenClaw hit Hacker News today. One tackles the trust problem at the hardware layer. The other reimagines what a personal AI-powered OS could look like.

## PrivateClaw: OpenClaw Agents Inside Confidential VMs

**[Show HN: PrivateClaw – AI agents running in confidential VMs you can verify](https://news.ycombinator.com/item?id=47891569)**

PrivateClaw starts from a pointed observation: hosted OpenClaw platforms today require you to trust them with plaintext. PrivateClaw's answer is to move the trust boundary to hardware.

The project runs OpenClaw agents inside Trusted Execution Environments (TEEs) backed by AMD's SEV-SNP standard. Each user gets a dedicated Confidential VM — no shared tenancy — with hardware-enforced memory encryption. The hypervisor cannot read guest memory. Inference also runs inside TEEs.

What makes this particularly interesting is the verification story. PrivateClaw ships an [open-source CLI](https://github.com/lunal-dev/privateclaw-cli) that walks through five attestation steps:

1. **SEV-SNP attestation** — validates a signed report from the AMD Secure Processor against AMD's root of trust
2. **vTPM verification** — confirms the virtual TPM's endorsement key is bound to the CVM attestation
3. **Host key binding** — verifies the SSH host key matches what's in the attestation report
4. **Inference endpoint check** — confirms the inference proxy cert is bound to TEE measurements
5. **Access control audit** — validates only your SSH key is authorized and the cloud guest agent is disabled

The architecture runs on Azure Confidential Compute for the CVM and inference gateway, powered by Confidential AI's TEE-backed vLLM deployment.

It's self-hostable in spirit — the verification tooling is fully open source — though the hosted tier starts free with a Pro plan at $69/month. Try it at `ssh privateclaw.dev`.

This is a genuinely novel approach to the trust problem that's been following OpenClaw deployments since the ClawHavoc incident. Whether TEE-backed agents become mainstream infrastructure or remain a niche security product is still an open question, but PrivateClaw is a real implementation worth watching.

## Lilo: A Personal OS Built on OpenClaw Channels

**[Show HN: Lilo – a self-hosted, open-source intelligent personal OS](https://news.ycombinator.com/item?id=47894947)**

On the lighter end, Lilo is a personal project that uses OpenClaw as a channel layer to build something bigger: a self-hosted personal operating system where your apps, files, AI assistant, and memories all live in one container.

The creator (@abi) built it to solve a specific frustration: wanting several small AI-powered personal apps (bookmarks, calorie tracker, TODO list) without the overhead of N separate deployments, auth configs, and URLs. Lilo wraps them all in a single container and lets an agent modify them directly — no code push required.

The OpenClaw connection is explicit in the submission: Lilo added multi-channel support (WhatsApp, email, Telegram) directly inspired by OpenClaw's approach. The demo in the Show HN — texting a photo of lunch to Lilo and having the calorie tracker update automatically — is a good illustration of why the channel layer matters.

Each "app" inside Lilo is just an HTML file with filesystem API access and full agentic capabilities. Memory is handled via a "LLM wiki" style tree of Markdown files — a pattern that'll be familiar to OpenClaw users.

Lilo is alpha, self-hosted, bring-your-own-keys. The GitHub repo is at [github.com/abi/lilo](https://github.com/abi/lilo).

---

Both projects represent different ends of the OpenClaw ecosystem spectrum: PrivateClaw is enterprise-grade infrastructure hardening; Lilo is personal computing reimagined. Worth bookmarking both as the space matures.
