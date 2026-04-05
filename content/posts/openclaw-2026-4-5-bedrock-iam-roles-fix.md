---
title: "OpenClaw Fixes Bedrock Auth Failure for EC2 and ECS IAM Roles"
excerpt: "PR #61194 fixes a Bedrock AWS SDK bug that injected 'AWS_PROFILE' as a literal API key, breaking IAM role-based auth on EC2 instances and ECS task environments."
coverImage: '/assets/images/posts/openclaw-2026-4-5-bedrock-iam-roles-fix.png'
date: '2026-04-05T08:00:00.000Z'
dateFormatted: April 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-5-bedrock-iam-roles-fix.png'
---

If you have ever deployed OpenClaw on an EC2 instance or ECS task using an **IAM role for Bedrock authentication** and seen a cryptic "No API key found" error — this fix is for you. [PR #61194](https://github.com/openclaw/openclaw/pull/61194), contributed by [@wirjo](https://github.com/wirjo) and reviewed by [@vincentkoc](https://github.com/vincentkoc), patches a subtle but infuriating bug in OpenClaw's Amazon Bedrock provider that prevented keyless IAM credential chains from working correctly.

## The Bug: AWS_PROFILE as a Literal API Key

When OpenClaw configures the Bedrock provider with `auth: "aws-sdk"`, it calls an internal resolver — `resolveAwsSdkApiKeyVarName()` — to determine which environment variable holds the AWS credential. The intent is that on machines with IAM roles (EC2 instance profiles, ECS task roles, Lambda execution roles), no environment variable is needed at all: the AWS SDK resolves credentials automatically via IMDS or the ECS metadata endpoint.

But there was a bug: **when no AWS environment variables were present**, `resolveAwsSdkApiKeyVarName()` fell back to returning the string `"AWS_PROFILE"` unconditionally. That string then got injected as the `apiKey` field in the provider configuration. The downstream auth resolver treated `"AWS_PROFILE"` as a literal key value, failed to find it as a credential, and threw `"No API key found"` — killing the request before the AWS SDK credential chain ever got a chance to run.

The result: **IAM role-based Bedrock auth was completely broken** for keyless environments. Users on EC2 with instance profiles, ECS tasks with task roles, or any setup relying on the AWS SDK credential chain (IMDS, ECS metadata, environment credential discovery) would hit this wall.

## The Fix

The patch closes three related GitHub issues ([#49891](https://github.com/openclaw/openclaw/issues/49891), [#50699](https://github.com/openclaw/openclaw/issues/50699), [#54274](https://github.com/openclaw/openclaw/issues/54274)) that had been open for months. The changes are surgical:

- **`resolveAwsSdkApiKeyVarName()`** now returns `undefined` instead of `"AWS_PROFILE"` when no AWS environment variables are present
- **`resolveBedrockConfigApiKey()`** gets the same treatment for the extension path
- **`resolveMissingProviderApiKey()`** now guards both the `providerApiKeyResolver` and `aws-sdk` branches: if the resolver returns nothing, the provider config is returned **unchanged** — no `apiKey` field injected, no poisoning of the auth flow
- The **AWS SDK credential chain** then runs at request time as designed — resolving via IMDS, ECS task role metadata, or whatever credential provider the environment offers

When AWS environment variables *are* present (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`), the existing behavior is preserved and markers are still injected correctly.

## Who This Affects

This bug affected anyone running OpenClaw with Bedrock in a **keyless IAM environment**:

- EC2 instances with an attached IAM instance profile
- ECS tasks with a task execution role
- Lambda functions with an execution role
- Any setup using IMDS-based credential discovery instead of explicit environment variables

If you were hitting this bug, you may have worked around it by explicitly setting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` even on instances where you'd prefer to use role-based auth. This fix means you no longer need that workaround.

## How to Get It

PR #61194 merged on April 5, 2026. It will be included in the next tagged OpenClaw release. No configuration changes are required — the fix is internal to the auth resolver.

To verify Bedrock auth is working correctly after updating, run:

```bash
openclaw doctor --section providers
```

If your Bedrock config shows a clean auth check without requiring explicit key variables, the fix is in.

---

Full diff and issue links: [PR #61194 on GitHub](https://github.com/openclaw/openclaw/pull/61194).
