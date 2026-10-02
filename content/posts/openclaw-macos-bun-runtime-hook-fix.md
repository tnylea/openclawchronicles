---
title: "OpenClaw macOS Pins Bun Runtime Hook Fix"
excerpt: "OpenClaw PR #163831 updates the macOS app runtime so module hooks receive valid URLs for Bun-replaced packages like ws."
coverImage: '/assets/images/posts/openclaw-macos-bun-runtime-hook-fix.png'
date: '2026-10-02T23:02:00.000Z'
dateFormatted: October 2nd 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-macos-bun-runtime-hook-fix.png'
---

OpenClaw merged [PR #163831](https://github.com/openclaw/openclaw/pull/163831), titled `build(macos): pin the app runtime to OpenClaw Bun 13311cf83e`, seconds before the October 2nd nightly cutoff. The patch updates the macOS app's bundled OpenClaw Bun runtime to fix a module hook URL problem.

The issue appeared in the runtime pinned by the macOS app: OpenClaw Bun `6a5d9c721f`, the first app build with `module.registerHooks`. When a load or resolve hook saw a bare package string such as `ws`, hooks that parsed the value as a URL could throw `ERR_INVALID_URL`.

The Gateway hosted by the app did not install module hooks itself, so the app-hosted Gateway was not directly affected. The risk was around plugins or tooling running hooks under the app runtime.

## The Runtime Pin

The fix repins `scripts/lib/openclaw-bun-macos.json` to fork release `openclaw-v1.4.3-20261002-13311cf83e-webkit-fb1167ebf2`.

According to the PR, that fork release is the previous `6a5d9c721f` runtime plus OpenClaw Bun PR #78 only. WebKit is unchanged. The new runtime gives hooks valid WHATWG URLs for Bun-replaced packages and virtual modules.

The behavior now matches the useful shape of Node:

- If a real `node_modules` file exists, hooks receive that file URL.
- If the package is replaced by Bun as a built-in, hooks receive a `bun-builtin:` URL.
- Hook consumers can safely pass received values through `new URL()`.

That last point is the whole fix. Tooling like `tsx` expects hook URL values to be URL-like. A bare package name is normal module syntax, but it is not a valid URL.

## Why This Matters For Plugins

OpenClaw's macOS app is not just a shell around one runtime path. It can host plugins, loaders, and tooling that exercise lower-level module behavior. When the runtime introduces a hook API, the compatibility details matter.

A plugin that uses a loader should not fail because a built-in replacement arrived as `ws` instead of a parseable URL. It is a small contract mismatch, but the resulting error is abrupt: `ERR_INVALID_URL`.

By pinning the runtime to the fork release, OpenClaw avoids forcing plugin authors to work around a transient runtime behavior. The platform presents a cleaner hook boundary instead.

## Evidence From The PR

The PR includes a focused hook URL probe. Resolve and load hooks called `new URL()` on every URL they received while `ws` was loaded through both `require` and `import`.

The reported comparison is clear: Node 24 had zero invalid hook calls, the previous OpenClaw Bun build had six invalid calls, and the new fork release had zero invalid calls. In the no-`node_modules/ws` case, the new release produced `bun-builtin:ws` instead of a bare string.

The author also reports that staging scripts validated both macOS `arm64` and `x86_64` binaries, both binaries reported `1.4.3-canary.1+13311cf83`, and the fork release passed signing and smoke on every target.

OpenClaw-specific validation included published `openclaw@2026.9.7` Gateway starts through the `registerHooks` path. Three interleaved starts on the previous runtime and three on the new runtime all reported 15 plugins and HTTP 200 readiness, with no `ERR_INVALID_URL` lines on the new candidate.

## The Practical Takeaway

This is a build-system and runtime pin, not a user-interface feature. Still, it matters for reliability because OpenClaw's native app runtime is part of the plugin execution environment.

The safest runtime bug is the one plugin authors never have to learn about. With this macOS pin, module hooks get URL-shaped inputs again, and tooling that expects Node-like hook behavior has a cleaner path through the OpenClaw app runtime.
