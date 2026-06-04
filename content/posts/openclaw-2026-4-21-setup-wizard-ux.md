---
title: "OpenClaw Setup Wizard Gets Clearer Security Warnings and Searchable Selects"
excerpt: "PR #69553 polishes the OpenClaw onboarding experience with a structured security disclaimer, yellow warning banner, loading spinners on model catalog fetches, and searchable model selection."
coverImage: '/assets/images/posts/openclaw-2026-4-21-setup-wizard-ux.webp'
date: '2026-04-21T08:05:00.000Z'
dateFormatted: April 21st 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-21-setup-wizard-ux.webp'
---

First impressions matter — and for a tool like OpenClaw, the setup wizard is often where new users decide whether they trust what they are about to configure. [PR #69553](https://github.com/openclaw/openclaw/pull/69553), merged today by [@Patrick-Erichsen](https://github.com/Patrick-Erichsen), is a focused UX pass that makes onboarding cleaner, more informative, and less likely to leave users guessing at a blank screen.

## A Security Disclaimer That Actually Gets Read

The original onboarding flow included a security disclaimer, but it was presented in a way that was easy to skim past. The update restructures it into a scannable layout with clear headings and — most visibly — a **yellow warning banner** that anchors the key message before users proceed.

This matters more than it might sound. OpenClaw is a self-hosted AI gateway with access to credentials, external services, and (for many users) personal communications. A first-run disclaimer that users actually absorb reduces the chance of misconfiguration surprises down the line. The new format takes cues from how security-sensitive CLI tools present warnings: structured, visible, unavoidable.

## Loading Spinners During Model Catalog Fetches

Anyone who has run through OpenClaw setup on a slower connection has probably stared at a blank prompt wondering whether something broke. The new PR adds `prompter.progress(...)` loading spinners around both `loadModelCatalog` calls in `model-picker.ts`.

The fix is minimal — a `try/finally` block ensures spinners always stop even if the fetch fails — but the user experience difference is significant. Instead of apparent hangs, users now see an active indicator. Combined with the API key placeholder text added to credential prompts, the flow feels substantially more polished.

## Searchable Model Selection

For users with access to many model providers, the model picker previously rendered as a flat list. PR #69553 wires in `searchable: true` via a new `WizardSelectParams` field, activating Clack's autocomplete behavior on the model selection prompt.

The implementation mirrors the existing `multiselect` pattern in the codebase, keeping it consistent. Users can now type to filter the list — a small change that becomes genuinely useful when you have 30+ models across multiple providers configured.

## What Did Not Change

The Greptile review gave this PR a confidence score of 5/5, noting that all changes are strictly additive and UX-scoped with no logic or data-flow modifications. The one minor flag was a CHANGELOG wording discrepancy — the entry mentioned channel-setup spinners that were not actually in the diff. The implementation is otherwise clean.

---

If you have been running OpenClaw for a while, these changes will not affect you directly. But if you help others get started — recommending OpenClaw to teammates, writing guides, or maintaining deployment scripts — the improved first-run experience is worth knowing about. Less friction at setup means fewer questions later.

The full diff is on [GitHub](https://github.com/openclaw/openclaw/pull/69553).
