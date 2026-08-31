---
title: "OpenClaw Restores Runtime Capability Review"
excerpt: "OpenClaw setup now restores runtime capability review during model activation, keeping consent, verification, and cancellation visible."
coverImage: '/assets/images/posts/openclaw-2026-8-31-runtime-capability-review.png'
date: '2026-08-31T23:01:00.000Z'
dateFormatted: August 31st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-31-runtime-capability-review.png'
---

OpenClaw merged a P1 setup repair tonight that brings runtime capability review back into fresh model activation flows. [PR #134101](https://github.com/openclaw/openclaw/pull/134101), `fix(setup): restore runtime capability review`, covers macOS, Control UI, Gateway setup, commands, agents, and the auth-provider boundary.

The bug was subtle but important. Fresh macOS and Control UI setup could miss the runtime plugin capability review during model activation. In installed-package testing, approval exposed a second failure: activation could still use the Gateway's startup metadata, where the newly installed runtime was not present. Source checkouts with a bundled runtime hid both problems.

## What Changed

Activation now goes through the existing Gateway-hosted setup wizard. That keeps the exact capability note, default-false confirmation, progress, and result in one owner-controlled path.

The PR also tightens the lifecycle around that flow:

- Declines, cancellations, and ambiguous errors stop the interactive candidate sequence.
- Retained sessions cannot be replaced out from under the user.
- Native cancellation follows the currently outstanding request after awaits.
- The installer prepares a fresh metadata, cache, and registry generation for artifact capture and model probing.
- Runtime/model facts are revalidated before the route is committed.

In plain terms, the review appears where users expect it, approval leads to a verified route, and cancellation or failure stays visible instead of being smoothed over.

## Why It Matters

Runtime installation is a trust boundary. A setup flow that installs a runtime before model activation needs the user to see what that runtime can do, and it needs the later verification step to check the same accepted artifact rather than stale process metadata.

That is especially important for installed packages, where the runtime may not exist in the Gateway metadata available at startup. OpenClaw now keeps the Gateway responsible for review and activation while letting clients keep their existing session and setup receipt.

The result should be clearer first-run behavior: users can approve runtime capabilities, continue through verification, and reach working inference. Declining leaves the configured model unchanged. Failure and cancellation still have visible outcomes.

## Proof From The Merge

The PR reports real installed-browser proof in a disposable macOS guest using a fresh runtime and normal Codex CLI authentication. The corrected candidate presented the capability review, installed the runtime, restarted the Gateway normally, verified the selected public model, and reached Custodian onboarding with a successful chat response.

It also reports broad automated coverage: 265 Model Setup unit tests, 25 browser scenarios across approval, decline, cancellation, reconnect, and focus restoration, 149 inference-owner tests, and 120 Gateway/installer tests. Exact-head hosted CI later passed with the required gate green.

There is one clearly documented limit: signed native GUI before/after proof remains unperformed because the disposable macOS environment stopped at the login gate. The PR treats that as a named follow-up rather than claiming it passed.

## Operator Takeaway

This is not a release by itself, but it is a meaningful setup reliability and consent repair on main. The next release that includes it should make fresh runtime activation easier to trust: the review is explicit, the accepted runtime is rechecked before use, and cancellation does not leave a misleading half-success state.
