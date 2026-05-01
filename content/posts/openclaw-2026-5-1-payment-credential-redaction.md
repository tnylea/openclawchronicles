---
title: "OpenClaw Now Redacts Payment Credentials From Agent Logs"
excerpt: "OpenClaw's logging sanitizer now redacts payment credential fields like cardNumber and sharedPaymentToken, closing a tool payload privacy gap."
coverImage: '/assets/images/posts/openclaw-2026-5-1-payment-credential-redaction.png'
date: '2026-05-01T08:00:00.000Z'
dateFormatted: May 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-5-1-payment-credential-redaction.png'
---

A security hardening PR merged into OpenClaw's main branch this morning quietly closes a privacy gap that could have exposed payment credential fields in agent tool logs. While not a critical vulnerability, the change is meaningful for any deployment where agents handle payment tools or structured financial data.

## What Changed

[PR #75230](https://github.com/openclaw/openclaw/pull/75230) by contributor **stainlu** adds two things to OpenClaw's core logging sanitizer (`src/logging/redact.ts`):

1. **Payment credential field patterns** — The default redaction list now includes field names like `cardNumber`, `sharedPaymentToken`, `cvv`, and `cvc` across JSON, URL, CLI, and assignment contexts.
2. **Key-aware structured field redaction** — A new helper `redactSensitiveFieldValue(key, value)` lets the sanitizer apply masking based on the *containing object key*, not just a value pattern match.

Before this change, the existing sanitizer would scan tool result strings for generic secrets, passwords, and token prefixes — but it had no awareness of a structured object field named `cardNumber`. If an agent received a payment tool result with bare card data in a structured payload, those values would pass through the log pipeline unmasked.

## Why the Key-Aware Approach Matters

The old `redactStringsDeep` implementation walked nested objects and passed every string through `redactToolPayloadText(value)` — without context about what *key* that string lived under. This works fine for API keys and bearer tokens that have recognizable prefixes. It doesn't work for payment card numbers, which look like ordinary 16-digit strings.

The new pattern is narrowly scoped by design. Rather than adding a broad card-number regex that would catch legitimate diagnostic values like `amount`, the PR targets explicit field-name groups: card identifiers, CVC/CVV codes, and shared payment tokens. This keeps redaction precise and avoids masking innocent numeric data.

## Also Merged: Voice-Call SecretRef Auth Fix

In the same batch of May 1st merges, [PR #73632](https://github.com/openclaw/openclaw/pull/73632) by **VACInc** fixes a long-standing bug in the voice-call plugin. Previously, Twilio's `authToken` config field only accepted plain strings — meaning if you tried to reference it via a `SecretRef` object (OpenClaw's secret management system), the plugin would reject it at registration time with a schema parse error.

The fix widens the schema to accept `SecretInput` objects alongside plain strings, resolving the token before constructing the Twilio provider. This was a follow-up to [PR #72607](https://github.com/openclaw/openclaw/pull/72607), which added manifest-level voice-call SecretRef support but left a runtime schema mismatch behind.

If you're running the voice-call plugin with secrets stored in a vault or environment reference rather than hardcoded in `openclaw.json`, this fix unlocks that workflow properly.

## Who This Affects

- **Payment credential redaction**: Any OpenClaw deployment where agents call payment-related tools and structured tool results flow through the logging pipeline. This includes custom plugins that return financial data in structured `toolResult` objects.
- **Voice-call SecretRef fix**: Users of the bundled voice-call plugin who want to reference their Twilio credentials via `SecretRef` rather than plain-text config.

Neither change requires a config update — the payment credential redaction is automatic once the new version ships in a release, and the voice-call fix only matters if you were previously working around the schema limitation.

## When to Expect These in a Release

Both PRs are now in `main` ahead of the next OpenClaw release. The project ships calendar-versioned releases roughly weekly; given the April 30th `v2026.4.29` release just landed, the next release window is likely mid-to-late next week. Follow the [GitHub releases page](https://github.com/openclaw/openclaw/releases) or check OpenClaw Chronicles for coverage when it drops.
