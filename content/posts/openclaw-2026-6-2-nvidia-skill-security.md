---
title: "OpenClaw and NVIDIA Partner to Secure Every ClawHub Skill"
excerpt: "ClawHub now runs NVIDIA SkillSpector on every published skill, ships signed Skill Cards, and releases 67K scan results as an open dataset for security researchers."
coverImage: '/assets/images/posts/openclaw-2026-6-2-nvidia-skill-security.webp'
date: '2026-06-02T08:00:00.000Z'
dateFormatted: June 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-2-nvidia-skill-security.webp'
---

ClawHub has always been a target. When it launched alongside OpenClaw, it was immediately hit by actors trying to slip malware-bundled skills into the registry. The response at the time — a partnership with VirusTotal for traditional malware scanning — was a good first step. But the team was honest about its limits: classic malware scanners were never designed to catch *agentic* risk.

A skill that silently exfiltrates your logs isn't a virus. A skill that points your agent at the wrong CLI flag and wipes production isn't ransomware. Neither shows up cleanly on a hash reputation list. That gap is exactly what the OpenClaw team announced they're closing, in a new collaboration with NVIDIA published June 1st on the [official OpenClaw blog](https://openclaw.ai/blog/openclaw-nvidia-skill-security).

## The ClawScan Pipeline

The new security pipeline, called **ClawScan**, layers three independent scanners before any skill reaches the ClawHub catalog:

1. **Static analysis** — scans for dangerous code patterns and risky code paths
2. **VirusTotal** — flags known malware signatures and reputation signals
3. **NVIDIA SkillSpector** — an AI-assisted semantic scanner built specifically for agentic risk: hidden instructions, overbroad capabilities, mismatches between a skill's claimed purpose and its actual behavior

Each skill version triggers an OpenAI Codex agent that weighs all three scanner outputs alongside provenance, metadata, and moderation history. The agent produces a **Skill Card** and a final verdict: Clean, Suspicious, or Malicious.

## What Are Skill Cards?

Skill Cards are a new open trust-artifact format — authored by ClawHub, not the publisher — that ship alongside every published skill. They document:

- Who published the skill and where it came from
- What ClawScan found across all three scanners
- What the skill can actually do (verified, not self-reported)

You can read a Skill Card on the ClawHub detail page or from the terminal:

```bash
openclaw skills verify <slug> --card
```

## The Data Is Surprising

The team expected heavy overlap between the three scanners. They got almost none.

Across 67,453 published skill versions in the v1 dataset:

| Scanner pair | Shared positives | Jaccard agreement |
|---|---|---|
| VirusTotal + SkillSpector | 3,286 | 0.094 |
| Static analysis + SkillSpector | 3,511 | 0.104 |
| Static analysis + VirusTotal | 586 | 0.065 |

No pair agrees on more than 10.4% of combined positives. Only 0.69% of skills are flagged by all three at once. Meanwhile, 81.9% of positive findings come from a single scanner only.

The takeaway isn't that any scanner is wrong — it's that each one is seeing a different part of the risk surface. VirusTotal catches malware reputation. Static analysis catches dangerous code patterns. SkillSpector catches agentic mismatch. You need all three.

## Open-Source Dataset on Hugging Face

Rather than keep the signal private, the team is releasing the full scan corpus — all 67,453 skill version outcomes — as a public dataset on Hugging Face: [OpenClaw/clawhub-security-signals](https://huggingface.co/datasets/OpenClaw/clawhub-security-signals).

The dataset covers every scanner's findings for each skill, making it a valuable resource for researchers building the next generation of agentic-risk tooling. The team ran the full ClawScan suite burning millions of GPT-5.5 tokens in the process; now that work is shareable.

Special thanks to Jacob Tomlinson, Agustin Rivera, and Michael Appel from NVIDIA for the collaboration.

## Why This Matters for OpenClaw Users

If you install skills from ClawHub, every skill you see has now passed through this pipeline. Suspicious skills are flagged with advisories. Malicious skills are blocked before they're ever published. And for the first time, you can read a verified, independent summary of what a skill actually does before you trust it with your agent.

The OpenClaw team's closing line says it well: *A rising tide lifts all claws.*
