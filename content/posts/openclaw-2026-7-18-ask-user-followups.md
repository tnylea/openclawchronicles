---
title: "OpenClaw Makes ask_user Work Across Every Surface"
excerpt: "OpenClaw now routes ask_user prompts through Codex, Copilot, chat channels, native apps, and a docked web panel."
coverImage: '/assets/images/posts/openclaw-2026-7-18-ask-user-followups.png'
date: '2026-07-18T08:00:00.000Z'
dateFormatted: July 18th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-18-ask-user-followups.png'
---

OpenClaw's question flow just became a cross-surface product feature instead of a runtime detail. [PR #110372](https://github.com/openclaw/openclaw/pull/110372), `feat: ask_user follow-ups — harness convergence, channel finalization + reactions, native cards, docked web panel`, merged at 07:32 UTC on July 18.

The PR is a full follow-up set to the earlier `ask_user` work. It closes gaps across Codex, Copilot, Telegram, Discord, Slack, WhatsApp, Signal, iMessage, native mobile apps, macOS, and the web Control UI.

## One Question Model

Before this merge, harness-driven questions still had uneven behavior. Codex and Copilot could fall back to legacy text-only paths, some channel buttons stayed active after the question had already been resolved, reaction-only channels had no clean answer path, and native apps did not handle question events.

OpenClaw now routes Codex `request_user_input` and Copilot user-input requests through the same Gateway question runtime used by native `ask_user` prompts. That means the web card, channel buttons, plain-text claims, and terminal state handling all share one model.

Secret questions remain on the warned text path and do not register as Gateway questions.

## Better Channel Behavior

The channel changes are practical. Telegram, Discord, and Slack now edit the delivered prompt when it reaches a terminal state. Buttons are removed and the message is marked answered, expired, or cancelled.

WhatsApp, Signal, and iMessage get a reaction-based answer path for eligible prompts. For single-select, non-secret questions with up to four options, users can tap a numbered reaction and OpenClaw resolves the stored option value.

That small detail matters because it keeps the option identity stable even if the display text changes.

## Native And Web Cards

Native apps now get first-class question cards. iOS and macOS share a SwiftUI card through OpenClawKit, while Android gets a Compose version. The cards support option descriptions, multiselect, free-text Other responses, countdowns, terminal states, and reconnect refresh through `question.list`.

On the web, questions now dock above the composer instead of replaying as a bulky card inside the message stream. Multi-question prompts step one at a time, options get numeric keyboard shortcuts, Skip cancels the current prompt, and answered questions collapse into a compact stream summary.

## Why It Matters

For users, this turns agent questions into something predictable. If an agent needs a deployment choice, a review target, or a preference confirmation, the answer experience should feel native whether the user is in Codex, Copilot, Slack, mobile, or the web UI.

For operators, the bigger win is state cleanup. Stale buttons and replayed prompt cards are a common source of confusion in long-running agent workflows. PR #110372 makes the resolved state visible and trims old UI from the active path.

## Evidence

The PR reports live end-to-end proof using an isolated development Gateway and an OpenAI Responses run. The test asked a single-select and multiselect pair, advanced through the docked web panel, submitted the answers, and resumed the agent with exactly those values.

The validation list is broad: 4,385 UI chat tests, core question runtime tests, harness bridges, six channel question suites, Playwright question-flow coverage, OpenClawKit builds, 913 Swift tests, Android unit tests, Android assemble and lint, protocol coverage, TypeScript lanes, i18n verification, SDK surface checks, and a full `pnpm build`.

## Operator Takeaway

`ask_user` is now one of OpenClaw's core interaction contracts. This merge makes it harder for surfaces to drift apart and easier for agent workflows to ask for human judgment without trapping users in the wrong client.
