---
title: "OpenClaw Plugin Loading Keeps Credential Targets"
excerpt: "OpenClaw plugin source artifacts now use the canonical loader so import-only package exports do not hide credential-reference targets."
coverImage: '/assets/images/posts/openclaw-2026-8-28-plugin-artifacts-credential-targets.png'
date: '2026-08-28T23:02:00.000Z'
dateFormatted: August 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-28-plugin-artifacts-credential-targets.png'
---

OpenClaw merged a plugin tooling fix just before the nightly cutoff that should matter to developers working from source checkouts. [PR #132166](https://github.com/openclaw/openclaw/pull/132166) fixes a source artifact loading path that could raise `ERR_PACKAGE_PATH_NOT_EXPORTED` even when dependencies were validly installed.

The more subtle part is credential metadata. After the loader failure, credential-reference generation could silently omit a channel's targets. For plugin authors and maintainers, that is the dangerous version of a build issue: the tool appears to continue, but the generated credential map no longer represents every owner that should be present.

## Canonical Loader For Source And Public Artifacts

The merged repair sends both source artifacts and compiled public artifacts through OpenClaw's canonical plugin loader. Before this change, a TypeScript hook could send source artifacts through a second `require` path. That path did not behave the same way with import-only package exports.

Using one canonical loader avoids creating two different module resolution stories for what is logically the same plugin artifact. The PR also retires transformed source modules and plugin-local dependencies together while preserving shared modules outside that boundary.

That boundary matters because plugin development often mixes bundled code, installed dependencies, SDK facades, and source transforms. If cache retirement is too broad, it can disturb unrelated shared modules. If it is too narrow, stale source dependency exports can survive a reload.

## Credential References Fail More Honestly

The fix also changes how source credential-reference generation behaves when it encounters a broken contract. Instead of silently losing a target, the generator reports the present but broken owner. Ordinary runtime discovery still isolates unavailable owners and preserves healthy sibling owners.

That is the right operational shape for credential tooling. Broken plugin metadata should be visible at generation time, not hidden in a partial matrix that looks clean until someone tries to configure or audit the affected channel.

The issue was found while validating Buzz multi-account setup, but the PR says the repair leaves Google Chat's source and all dependency versions unchanged. The scope is loader behavior, cache ownership, and credential-reference reporting rather than a channel-specific workaround.

## What Changes For Plugin Authors

The practical impact is narrow but important:

- Source-checkout plugin tooling works with import-only package exports.
- Credential metadata should not silently drop affected owner entries.
- Built native loading and module identity contracts remain unchanged.
- Runtime discovery can still degrade unavailable owners without taking down healthy siblings.
- No new settings, dependency changes, migrations, or schema changes are introduced.

The evidence package includes a reproduction in a fresh Node 24.20 process, module identity checks across bundled and installed paths, source credential-matrix generation, 135 focused tests, hosted CI, and a full local `pnpm build`.

For teams building or auditing OpenClaw plugins from source, this is a good cleanup. It removes a duplicate loader branch and makes credential-generation failures louder, which is exactly where plugin infrastructure should be conservative.
