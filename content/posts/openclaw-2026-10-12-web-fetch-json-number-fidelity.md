---
title: "OpenClaw Web Fetch Preserves JSON Numbers"
excerpt: "OpenClaw PR #170123 fixes web_fetch so models see exact JSON number tokens instead of rounded IDs, null infinities, or rewritten negative zero."
coverImage: '/assets/images/posts/openclaw-2026-10-12-web-fetch-json-number-fidelity.png'
date: '2026-10-12T23:03:00.000Z'
dateFormatted: October 12th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-12-web-fetch-json-number-fidelity.png'
---

OpenClaw merged [PR #170123](https://github.com/openclaw/openclaw/pull/170123), a deceptively important fix for `web_fetch`: JSON numbers are now preserved as exact source tokens before the model sees them.

The bug was classic JavaScript footgun territory. When `web_fetch` parsed JSON and serialized it back for model-visible output, large identifiers and high-precision decimals could be rounded, very large exponents could become `null`, and negative zero could be rewritten as `0`.

For ordinary web pages, that might not matter. For agent work, it absolutely can.

## Why JSON Number Fidelity Matters

Agents increasingly fetch APIs, not just human-readable pages. Those APIs contain issue IDs, database IDs, payment IDs, timestamps, balances, prices, sequence numbers, and scientific values. A model does not need those values to be "numerically convenient." It needs the exact token the server sent.

The PR's examples include identifiers such as `9223372036854775807` and `12345678901234567890`, high-precision decimals, `1e400`, and `-0`. Those are the kinds of values that expose the mismatch between JavaScript's default number behavior and a tool result that is supposed to preserve source data.

If an agent reads a large ID incorrectly, the failure can be subtle. A rounded identifier can still look plausible. A nullified exponent can look like missing data. A changed zero sign can matter in numeric protocols or tests. The dangerous part is not just that the value changes; it is that the change can be silent.

## The Shape Of The Fix

The merged implementation keeps the existing two-space JSON formatting, size limits, truncation behavior, malformed JSON fallback, content-type classification, external-content wrappers, and non-JSON handling.

The change is focused on numeric token preservation. The PR uses the native JSON reviver source context with `JSON.rawJSON` for numbers, then keeps the existing serializer and indentation path. Runtime support was exercised across supported Node 24 and 26 branches, plus the repository-pinned OpenClaw Bun version.

That narrowness is good engineering. The visible output format should not churn just because one fidelity problem was fixed. Existing agents, tests, and truncation boundaries depend on stable formatting.

## What Changes For Models

The model now receives the server's exact numeric tokens in JSON tool results. In the PR's recorded proof, main rounded or rewrote several problematic values, while the candidate preserved them. Ordinary JSON, HTML, oversized JSON truncation, and non-JSON extraction remained equivalent after expected normalization.

This is one of those fixes that improves trust in the tool layer. `web_fetch` is a bridge between the internet and the model. If that bridge quietly edits data, the model can produce confidently wrong follow-up actions.

## A Small Fix With A Large Blast Radius

The PR is labeled P2, but its blast radius is broad because `web_fetch` is such a basic primitive. Any workflow that asks OpenClaw to inspect API responses, structured docs, registry metadata, analytics payloads, or machine-generated reports benefits from exact JSON number handling.

For users, there is no new setting to flip. The improvement is that fetched JSON should now be a more faithful representation of the source response, especially in the edge cases where "close enough" was never actually close enough.
