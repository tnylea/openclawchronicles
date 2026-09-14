---
title: "OpenClaw Keeps Exec Provider Argument Spaces"
excerpt: "OpenClaw PR #148327 preserves literal leading and trailing whitespace in config set provider arguments for exec secret providers."
coverImage: '/assets/images/posts/openclaw-2026-9-14-exec-provider-whitespace.png'
date: '2026-09-14T23:15:00.000Z'
dateFormatted: September 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-14-exec-provider-whitespace.png'
---

OpenClaw merged [PR #148327](https://github.com/openclaw/openclaw/pull/148327), a CLI fix for `config set --provider-arg` when configuring exec secret providers.

Before the patch, the builder silently trimmed leading and trailing whitespace from provider arguments. That sounds small until the argument is meant to be literal. Secret providers, shell wrappers, and compatibility adapters can treat whitespace as data, not decoration.

## What Changed

The PR removes the trimming transformation from the `--provider-arg` builder path. Arguments supplied through the command now reach the provider as literal values, while the existing safety checks remain in place.

That means the fix keeps:

- Schema validation.
- Command-path trust checks.
- Execution opt-in behavior.
- Existing argument-length limits.
- The behavior of JSON, batch, and guided input paths.

The user-facing note is straightforward: providers now receive the literal arguments the operator supplied. If a previous command already saved a trimmed value, OpenClaw cannot reconstruct the original whitespace automatically, so the intended value must be reapplied.

## Why Whitespace Matters

Exec secret providers often sit at the boundary between OpenClaw configuration and a local credential source. They may call a password manager, hardware-backed helper, wrapper script, or platform-specific secret command.

At that boundary, silent normalization is risky. Trimming can turn a deliberate value into a different value without producing an error. Worse, the user may only discover the mismatch when the provider fails later, far away from the command that changed the data.

This PR is a small correctness fix, but it follows a good rule for configuration tooling: preserve the operator's bytes unless the contract explicitly says otherwise.

## Validation

The PR reports exact-head CI passing with 120 successful jobs and 16 intentional skips. The focused provider coverage included 37 passing cases across input and integration tests, including builder, JSON, and batch invocation.

The original proof used ten real CLI commands per phase to verify all 128 literal arguments, the 1,024-character boundary, execution gating, and missing-command rejection. The refreshed head preserved the exact four-file patch, and multiple review passes found no P0-P2 issues.

The maintainer also notes that native proof is POSIX-only and that NUL handling is covered in config rather than native execution. Those limits are useful to keep attached to the result because they describe exactly what was proven.

## What Operators Should Do

If you use `config set --provider-arg` for exec secret providers and intentionally include leading or trailing spaces, reapply those values after upgrading. The fix prevents future trimming, but it does not infer what an older trimmed argument used to be.

PR #148327 is narrow, well-tested, and mostly invisible when things are working. That is the right shape for a configuration correctness repair.
