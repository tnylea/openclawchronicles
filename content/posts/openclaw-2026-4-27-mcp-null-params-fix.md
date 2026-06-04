---
title: "OpenClaw Fixes Null Parameter Bug for Parameterless MCP Tools"
excerpt: "PR #72673 fixes a bug where MCP tools with no required parameters received null instead of an empty object, causing silent failures in tool call loops."
coverImage: '/assets/images/posts/openclaw-2026-4-27-mcp-null-params-fix.webp'
date: '2026-04-27T08:10:00.000Z'
dateFormatted: April 27th 2026
authorName: Cody
authorPicture: '/assets/images/authors/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-4-27-mcp-null-params-fix.webp'
---

## The Bug: Parameterless Tools Getting Null

If you've ever built or used an MCP tool that takes no arguments — a simple status checker, a list command, a health probe — you may have hit a subtle but maddening failure in OpenClaw's tool call pipeline. [PR #72673](https://github.com/openclaw/openclaw/pull/72673), merged this morning by amknight, squashes it.

The problem: when an MCP tool has an object schema with no required parameters, OpenClaw's tool call normalization logic was passing `null` as the `params` argument instead of an empty `{}` object. Many MCP servers don't gracefully handle `null` where they expect an empty object, leading to silent failures or unexpected errors mid-tool-loop.

## What Changed

The fix introduces a new helper function, `isObjectSchemaWithNoRequiredParams()`, that correctly detects object-typed schemas with zero required fields. It handles both the `type: "object"` and `type: ["object", ...]` union cases:

```typescript
function isObjectSchemaWithNoRequiredParams(schema: unknown): boolean {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return false;
  }
  const record = schema as Record<string, unknown>;
  const type = record.type;
  const hasObjectType =
    type === "object" ||
    (Array.isArray(type) && type.some((entry) => entry === "object"));
  if (!hasObjectType) return false;
  return !Array.isArray(record.required) || record.required.length === 0;
}
```

When this condition is met, OpenClaw now injects a `prepareArguments` wrapper that returns a clean empty object `{}` instead of `null`. Parameterless tools finally receive a valid argument structure every time.

The PR was originally branched as `codex/fix-null-tool-params-loop`, suggesting it was developed with Codex assistance before being polished and submitted.

## Who Is Affected

This fix matters if you:

- Use MCP tools that accept no required arguments (e.g., `list_resources()`, `get_status()`, `ping()`)
- Are running MCP servers that don't silently tolerate `null` params
- Have noticed certain tool calls producing unexpected failures or looping without completing

Parameterless tools are extremely common across MCP server ecosystems. The null-vs-empty-object mismatch is a classic silent bug — everything looks fine until the tool call hits a strict server implementation.

## A Secondary Issue to Watch

The Aisle Security bot flagged a potential denial-of-service in the related `schemaHasRequiredParams()` function: it recursively traverses `allOf`/`anyOf`/`oneOf` schema variants without a depth limit or cycle detection. For tool schemas sourced from untrusted external MCP servers, a deeply nested or cyclic schema could cause a stack overflow or CPU spike.

The security bot recommended switching to an iterative traversal with a max-depth guard and a `WeakSet` for cycle detection. This secondary concern may receive a follow-up PR.

## Bottom Line

Small fix, real impact. If parameterless MCP tools in your OpenClaw setup have been silently misfiring, this patch is what you've been waiting for. Expect it in the next release build.

**Source:** [PR #72673 on GitHub](https://github.com/openclaw/openclaw/pull/72673)
