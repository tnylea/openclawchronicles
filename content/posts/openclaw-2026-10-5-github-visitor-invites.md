---
title: "OpenClaw Fixes GitHub Visitor Invite Rate Limits"
excerpt: "OpenClaw PR #165368 makes GitHub visitor invites use Gateway credentials, avoiding anonymous quota failures and giving administrators clearer diagnostics."
coverImage: '/assets/images/posts/openclaw-2026-10-5-github-visitor-invites.png'
date: '2026-10-05T08:06:00.000Z'
dateFormatted: October 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-5-github-visitor-invites.png'
---

OpenClaw merged [PR #165368](https://github.com/openclaw/openclaw/pull/165368), a Gateway and visitor-access fix for GitHub-based invitations. The issue was concrete: inviting a valid GitHub user could fail with a misleading "check the login" style error when the Gateway host had exhausted GitHub's anonymous API quota.

For administrators using Visitor Access, that is a bad failure mode. The user exists, the invite is valid, and the operator is left chasing the wrong problem.

## The New Lookup Path

Visitor Access previously performed its own anonymous request to GitHub's user API. The fix routes lookup through the Gateway's existing authenticated GitHub identity resolver instead.

That matters because a configured Gateway token has GitHub's normal authenticated quota rather than the much smaller anonymous quota. The PR says visitor invitation and login-based revocation now use `runtime.gateway.resolveGitHubAccount`, a trusted plugin runtime capability backed by the Gateway's credential selection and canonical identity validation.

The policy is intentionally strict. If a configured token is rejected, OpenClaw does not silently fall back to anonymous lookup. Operators can repair or remove the credential, while grant-ID and profile-ID revocation remain available. Existing sign-in recovery behavior is unchanged.

## Better Errors

The PR also improves diagnostics. Instead of mapping every failed GitHub lookup to a bad-login message, OpenClaw can now distinguish between:

- A login that was not found
- An invalid login
- A primary or secondary GitHub rate limit
- Sanitized upstream failures

When GitHub provides a retry time for a rate limit, the error can include that timing. If no Gateway token is configured, the message can also suggest configuring one.

That is useful operational polish. A failed invite should tell the administrator whether they typed the wrong login, hit a quota wall, or need to fix credential configuration.

## Why It Matters

Visitor Access is an authority boundary, not just a convenience workflow. The lookup result decides which immutable GitHub account ID is being invited or revoked. Reusing the Gateway's identity resolver reduces duplicated GitHub behavior and keeps account validation closer to the part of OpenClaw that already owns provider credentials.

The PR also classifies body-reported secondary rate limits as rate limits in the shared GitHub transport. Before this, those could appear as generic permission failures, which made the operational story murkier.

## Validation

The PR reports a live reproduction on October 5, 2026: a valid GitHub login failed while the host's anonymous quota was empty, then succeeded after quota reset. New regression tests failed on the old code and passed after the fix.

Focused test coverage included visitor plugin tests, authority tests, Gateway GitHub account tests, Control UI GitHub API tests, identity tests, and agent visitor-access tests. The PR also reports `pnpm check:changed`, SDK surface/export checks, generated-docs checks, `git diff --check`, and scoped-clean Codex autoreview.

## Bottom Line

PR #165368 makes OpenClaw GitHub visitor invites more reliable under real host traffic. It also gives administrators better failure messages when GitHub identity lookup cannot complete.
