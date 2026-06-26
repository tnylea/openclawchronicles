---
title: "OpenClaw Tightens Markdown Link Fetching"
excerpt: "OpenClaw now avoids promoting bracketed markdown citations into fetched bare links during link-understanding scans."
coverImage: '/assets/images/posts/openclaw-2026-6-26-markdown-link-fetch-guard.png'
date: '2026-06-26T23:07:00.000Z'
dateFormatted: June 26th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-26-markdown-link-fetch-guard.png'
---

OpenClaw merged [PR #96476, "fix(link-understanding): strip markdown links whose label contains brackets"](https://github.com/openclaw/openclaw/pull/96476), a P2 correctness and safety fix for link-understanding.

The affected path is `extractLinksFromMessage`, which strips markdown links before scanning a message for bare URLs. That distinction is intentional. A display-only citation such as `[docs](https://docs.example)` should not automatically become a URL that OpenClaw fetches for link understanding.

The bug appeared when the markdown link label itself contained a bracket. Real notes often contain labels like `[my notes [v2]]`. The old stripping expression could fail to recognize that whole markdown link, leaving the URL behind for the bare-link scanner.

## The Repro

The PR gives this example:

```text
Check [my notes [v2]](https://internal.example/doc) for details
```

Before the fix, the markdown link was not stripped. The bare-link scanner could then extract the inner URL, including a trailing parenthesis, and treat it as a link to fetch.

After the fix, OpenClaw recognizes the URL as part of a markdown citation and suppresses it from the bare-link extraction result.

## Why It Matters

This is not just tidy markdown parsing. The PR calls out a correctness and safety issue: a display-only citation can be promoted into an actually fetched link.

That matters for any OpenClaw surface that receives pasted notes, transcripts, issue comments, or markdown-heavy messages. A user may include a private or internal URL as context, expecting it to stay as visible text. Link-understanding should not silently reinterpret that citation as a fetch target because the label includes a bracket.

The fix narrows that gap by allowing `]` inside a link label as long as it is not the closing `](` boundary. Existing normal markdown links and bare URLs keep their previous behavior.

## Validation

The PR includes a red-green proof for the old and new regex behavior. The old expression reproduces the bug by extracting `https://internal.example/doc)`. The new expression returns an empty link list for the bracketed-label markdown citation.

It also includes parity checks for unaffected cases: ordinary bare links, simple markdown links plus a bare URL, loopback/private-range test inputs, and adjacent markdown links.

A new unit test covers the bracketed-label case directly: `ignores markdown links whose label contains brackets`. According to the PR, the test fails on the old regex and passes after the fix.

For operators, the takeaway is straightforward. OpenClaw link-understanding is now less likely to fetch a URL that was merely part of a markdown citation, especially in the messy note formats that agents and humans actually exchange.
