---
title: "OpenClaw Plugin Lists Now Show Load Errors"
excerpt: "OpenClaw PR #128849 makes the default plugins list show why a plugin failed, without requiring verbose or JSON output."
coverImage: '/assets/images/posts/openclaw-2026-8-24-plugin-list-errors.png'
date: '2026-08-24T23:03:00.000Z'
dateFormatted: August 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-8-24-plugin-list-errors.png'
---

OpenClaw merged [PR #128849, "fix(plugins): surface load errors in the default plugin list"](https://github.com/openclaw/openclaw/pull/128849), a compact CLI repair for plugin diagnostics.

Before this change, `openclaw plugins list` could mark a plugin as `error` while hiding the actual reason it failed to load. The detailed reason was available in verbose and JSON output, but the default table only showed the status label and kept using the plugin description for its source-detail line.

That meant the fastest diagnostic command gave operators the least actionable view. A failed plugin row could say "error" without telling you whether the module was missing, the manifest was invalid, or the load path was wrong.

## What Changed

The default plugin list now prefers the already-recorded plugin error when the plugin's status is actually `error`.

The behavior stays narrow. Healthy plugins still show their descriptions. Disabled workspace plugins that carry explanatory error text still keep the existing descriptive display. JSON output and verbose output were already carrying the detailed failure reason, so this PR aligns the compact table with the information OpenClaw already had.

In the PR author's words, the owner changed without production-code growth: the production diff is reported as plus three and minus three, for a net zero line change.

## Why It Matters

Plugin ecosystems live or die by quick repair loops. If a plugin fails to load, the first command users run should point at the next useful action. Requiring people to rediscover `--verbose`, rerun a doctor command, or parse JSON for a common failure makes plugin debugging feel worse than it needs to.

This fix is especially useful for OpenClaw installations with mixed plugin sources:

- bundled official plugins
- ClawHub-installed skills and plugins
- workspace-local plugins under active development
- npm-managed plugin packages

When one of those fails, the default table now has enough context to start the investigation immediately.

## Evidence

The PR describes a pre-fix regression exercised through the real Commander parser with one failed plugin and one healthy plugin. The test failed because the rendered table omitted the specific failure reason, "missing plugin module," while continuing to show the failed plugin's description.

The final validation ran `node scripts/run-vitest.mjs src/cli/plugins-cli.list.test.ts src/cli/plugins-list-command.test.ts src/cli/plugins-list-format.test.ts`, with 47 tests passing across three files and two shards.

The regression coverage also checks the sibling case called out during review: healthy plugin descriptions and disabled workspace plugin descriptions remain visible even when a disabled plugin carries explanatory `error` text.

## Bottom Line

PR #128849 makes `openclaw plugins list` a better first-stop diagnostic command.

It does not change plugin loading, storage, public SDK behavior, or configuration. It simply exposes the failure reason OpenClaw already captured in the default place operators look first.
