---
title: "OpenClaw Native Plugins Add MCP Apps"
excerpt: "OpenClaw native plugins can now declare MCP App servers in their manifests and render session-bound inline apps."
coverImage: '/assets/images/posts/openclaw-2026-7-24-native-plugin-mcp-apps.png'
date: '2026-07-24T08:04:00.000Z'
dateFormatted: July 24th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-7-24-native-plugin-mcp-apps.png'
---

OpenClaw merged [PR #113224](https://github.com/openclaw/openclaw/pull/113224), adding support for manifest-declared MCP Apps in native plugins.

The problem was straightforward: native plugins could not declare the static MCP servers they needed in their manifests. Operators had to duplicate plugin-owned process configuration, and harness-native MCP tool results could not reliably preserve the metadata and session-bound view needed to render MCP Apps inline.

This update gives plugin authors a cleaner packaging path while preserving the policy boundaries that make MCP Apps safe to run inside OpenClaw sessions.

## What Plugin Authors Get

Native plugin developers can now ship a complete MCP App integration without asking every operator to copy server process configuration by hand.

The PR adds a generic manifest-to-runtime path for enabled native plugins. The manifest registry becomes the process-stable owner for declared servers, rather than relying on request-time filesystem polling or product-specific core policy.

For developers, that means the plugin manifest can describe the server integration as part of the plugin itself. For operators, normal MCP configuration remains authoritative.

## Inline App Rendering

The user-facing result is better app discovery and rendering. Users can discover the plugin's tools normally, execute them in a session, and receive the resulting app inline in that same session.

The PR also gives inline apps the full message width available to them. That is a practical detail, but it matters for MCP Apps that behave more like embedded interfaces than short text responses.

OpenClaw's app host now gets complete harness-native MCP results projected into it, including the metadata needed to preserve the app context. The PR says the existing plugin, tool-policy, session-authorization, and MCP App security boundaries are preserved.

## Why This Matters

MCP Apps are most useful when installation feels like installing an app, not manually reconstructing a process graph from documentation. Manifest-declared servers move OpenClaw closer to that model.

This also reduces configuration drift. If every operator must hand-copy a plugin's MCP process config, each install can become slightly different. A manifest-owned declaration gives plugin authors one place to define the expected server while still letting operators enforce their own MCP policy.

The change is especially relevant for native plugins that want to deliver visual or interactive tools inside OpenClaw, including dashboards, inspectors, editors, or review surfaces that benefit from inline app rendering.

## Validation

The PR includes a red reproduction against an unmodified commit where an enabled synthetic native plugin declared an stdio MCP server, but `loadEnabledBundleConfig` returned no server.

Final proof covered 158 assertions across plugin loading, Gateway MCP App operations, and Codex native/dynamic projection tests. The browser proof added 70 assertions, including responsive full-width inline app layout.

Repository gates also passed across Plugin SDK API and export checks, boundary checks, TypeScript lanes, lint, dead-export and import-cycle checks, docs-map validation, `git diff --check`, and the packaged build. The PR reports an operator acceptance test with an installed external native plugin verifying normal tool discovery, session-bound inline rendering, and in-place app interaction.

For OpenClaw's plugin ecosystem, this is a platform-level improvement: native plugins can now carry richer MCP App integrations with less per-operator setup.
