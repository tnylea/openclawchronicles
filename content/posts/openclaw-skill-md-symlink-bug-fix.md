---
title: "OpenClaw Fix: Plugin Skills Silently Skipped Due to Symlink Bug"
excerpt: "A merged PR fixes a critical bug where SKILL.md symlinks caused OpenClaw to silently skip all 23 plugin skills at load time due to a security path check failure."
coverImage: '/assets/images/posts/openclaw-skill-md-symlink-bug-fix.png'
date: '2026-04-10T08:00:00.000Z'
dateFormatted: April 10th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-skill-md-symlink-bug-fix.png'
---

If you noticed your OpenClaw plugin skills quietly not loading — no errors, no warnings, just silence — you weren't imagining things. A bug merged into `main` this morning (PR [#64166](https://github.com/openclaw/openclaw/pull/64166)) patches a subtle but significant issue that caused **all 23 plugin-bundled skills to be skipped at load time**.

## What Went Wrong

When OpenClaw builds its plugin distribution, `SKILL.md` files were being created as **symlinks** pointing into the `dist/` directory. This became a problem when the runtime security check called `realpathSync()` to resolve the actual file path — because symlinks resolve to their target, the resolved path ended up **outside the expected `dist-runtime/` directory**.

OpenClaw's `resolveContainedSkillPath` function saw this as a potential directory traversal attempt and rejected the path outright. The result: every plugin skill with a `SKILL.md` was silently dropped during the load phase. No crash, no log warning — just 23 skills quietly disappearing.

## The Fix

The solution (contributed by [@sliverp](https://github.com/sliverp)) was straightforward: add `SKILL.md` to the `shouldCopyRuntimeFile` whitelist so it receives a **hard file copy** during the build process instead of a symlink. This matches the already-established behavior for `package.json` and `plugin.json` — both of which were already getting hard copies for the same reason.

The fix is tracked under issue [#64138](https://github.com/openclaw/openclaw/issues/64138) and was merged on April 10, 2026.

## Who Was Affected?

Anyone running OpenClaw with **plugin-bundled skills** (skills distributed as part of a plugin package rather than installed standalone) would have hit this. The symptoms were:

- Skills defined inside plugins failing to appear in `/skills list` or `commands.list`
- Agent turns that should have triggered a skill behavior doing nothing or falling back to a generic response
- No visible error in Gateway logs — just missing skills

If you were troubleshooting mysteriously absent plugin skills over the past few days, this is likely the culprit.

## What to Do

The fix is already merged to `main`. If you're tracking the nightly build or self-compiling from source, pull the latest and rebuild. A tagged release incorporating this fix is expected in the upcoming `v2026.4.x` cycle.

For operators using stable tagged releases, keep an eye on the [releases page](https://github.com/openclaw/openclaw/releases) — the patch will land in the next tagged cut.

## A Note on Silent Failures

This bug is a good reminder of how dangerous silent failure modes can be in skill/plugin systems. A skill that errors loudly is debuggable; a skill that never loads at all is a ghost. The OpenClaw team may want to consider adding a startup log warning when skills are dropped during the security path check — even a single line like `[warn] skill skipped: path resolved outside dist-runtime` would have surfaced this immediately.

If you're a plugin author and want to verify your skills are loading correctly, check the output of `openclaw skills list` against your plugin manifest after each Gateway restart.
