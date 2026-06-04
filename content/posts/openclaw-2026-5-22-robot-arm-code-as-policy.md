---
title: "OpenClaw Gets a Robot Body: WIRED Explores Code as Policy"
excerpt: "WIRED's Will Knight used OpenClaw and Codex to control a LeRobot 101 arm, gripping objects and training pick-and-place models without specialized robotics skills."
coverImage: '/assets/images/posts/openclaw-2026-5-22-robot-arm-code-as-policy.webp'
date: '2026-05-22T23:00:00.000Z'
dateFormatted: May 22nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-22-robot-arm-code-as-policy.webp'
---

OpenClaw has always been described as an agent with hands — now a WIRED journalist has taken that metaphor literally. In a hands-on piece published May 20th, WIRED senior writer Will Knight documented what happened when he paired OpenClaw with a physical robot arm, and the results are hard to dismiss.

## The Setup: OpenClaw Meets LeRobot

Knight purchased a [LeRobot 101](https://huggingface.co/docs/lerobot/so101), an open-source robot arm project from HuggingFace designed to make robotics accessible to developers. The kit ships with two arms: a controller arm operated by hand, and a follower arm with a camera that learns to replicate those movements.

The initial setup — without AI help — took Knight several hours and nearly broke the motors by applying incorrect calibration settings. With OpenClaw and Codex handling the configuration, the process compressed dramatically. Codex navigated the tricky connection and calibration steps in the terminal while Knight supervised. Together they wrote a Python script that used computer vision libraries to identify and grip a red ball.

"Vibe-coding isn't perfect of course," Knight notes, "and hallucinations can introduce bugs especially when working with different hardware, but the results were impressive."

## Code as Policy: From Curiosity to Research Benchmark

The technique Knight explored has a formal name: *code as policy*, first described in a [2022 research paper](https://arxiv.org/abs/2209.07753) arguing that AI-generated code could serve as a flexible, generalizeable way to control robots. Knight's article arrives as that approach gains serious institutional momentum.

UC Berkeley roboticist Ken Goldberg — working alongside researchers from Nvidia, Carnegie Mellon, and Stanford — recently released [CaP-X](https://capgym.github.io/), a benchmark specifically measuring the robot-programming capabilities of coding models. The benchmark also ships with CaP-Gym, an environment for testing agents on both simulated and real hardware, and CaP-Agent0, a framework that can outperform models trained to directly control robot motion on certain manipulation tasks.

A notable finding: CaP-X data shows that for robot programming specifically, Gemini currently outperforms Claude and ChatGPT — likely because Google DeepMind has invested heavily in multimodal and physical-world understanding.

## What This Means for OpenClaw Users

For the average OpenClaw user, this piece signals something bigger than a fun demo. The same skill-based, tool-driven workflow that powers a personal assistant in Slack can now, with appropriate hardware, reach into the physical world.

OpenClaw's architecture — where skills load context and delegate to tools like `exec` and `browser` — maps naturally onto robotics workflows. A skill can call a Python calibration script, monitor a camera feed, and iterate on a training loop without a robotics PhD in the loop.

Spencer Huang, who has been running AI-robotics hackathons inside Nvidia, puts it bluntly: "Nearly anyone can get into robotics, which is the true holy grail." Making robots controllable by spoken or typed commands is the "critical unlock for robots in society."

## Still Early Days

Knight is careful to temper enthusiasm. Hallucinations introduced bugs when working with hardware APIs. The robot arm required human oversight throughout. And the "code as policy" benchmark shows uneven performance — the best model depends heavily on the specific task.

Still, the trajectory is clear. The same rapid improvement curve that took OpenClaw from curiosity to a platform running [100 concurrent AI agents](https://the-decoder.com/for-1-3-million-a-month-openclaw-founder-peter-steinberger-runs-100-ai-agents-that-code-review-prs-and-find-bugs/) is now playing out in physical robotics. OpenClaw was the connective tissue in this experiment, handling everything from hardware configuration to model training orchestration.

When WIRED starts experimenting with your software and a robot arm, you're no longer a niche developer tool.

**Read the full piece:** [I Gave My OpenClaw Agent a Physical Body](https://www.wired.com/story/i-gave-my-openclaw-agent-physical-body-robot/) — WIRED, May 20 2026
