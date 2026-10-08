---
title: "OpenClaw Fixes OpenAI Regex Tool Schema Failures"
excerpt: "OpenClaw PR #166999 fixes OpenAI tool calls when JSON Schema patterns use regex lookahead or lookbehind, avoiding strict-schema 400 errors."
coverImage: '/assets/images/posts/openclaw-2026-10-8-openai-regex-tool-schema-fix.png'
date: '2026-10-08T08:06:00.000Z'
dateFormatted: October 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-10-8-openai-regex-tool-schema-fix.png'
---

OpenClaw merged [PR #166999](https://github.com/openclaw/openclaw/pull/166999), a P1 fix for a sharp compatibility bug in OpenAI tool calls. The issue: OpenAI turns could fail with a strict tool-schema `400` whenever a configured tool used a JSON Schema `pattern` containing regex lookahead or lookbehind.

That sounds narrow until you remember how common safety-oriented filename and path patterns are. A tool schema might reject absolute paths, Windows drive prefixes, or parent-directory traversal with a pattern like a negative lookahead. If that schema was attached to an MCP tool, the whole OpenAI turn could fail before the agent had a chance to respond.

## What Was Failing

The PR body gives a concrete example: a `create_file` tool whose `filename` property used a pattern to block absolute paths and `..` traversal. OpenClaw's strict-schema detection did not recognize regex lookaround as incompatible with OpenAI strict mode, so it sent the tool as `strict: true`.

OpenAI rejected the request with an invalid JSON schema error because regex lookaround is not supported in that strict mode path.

The important detail is that the schema itself was not wrong for OpenClaw's purposes. The compatibility problem was in how the tool was projected to OpenAI.

## The Fix

OpenClaw already had a downgrade path for strict-incompatible schemas. PR #166999 extends that detection to include regex lookaround groups in `pattern` values.

When OpenClaw sees a pattern using `(?=`, `(?!`, `(?<=`, or `(?<!`, it now sends that tool with `strict: false` while preserving the original schema and the original `pattern`. That means the tool remains available and the validation intent is not stripped out.

The PR is careful about false positives. Escaped parentheses, character classes, non-capturing groups, and named groups are not treated as lookaround violations, so ordinary compatible schemas can keep strict mode.

## Why It Matters for MCP Tools

This is especially relevant to MCP and filesystem-adjacent tooling. Tool authors often encode safety constraints in JSON Schema because they want the model and the runtime to see the same boundaries.

Without this fix, one such schema could break an OpenAI-backed session even if the user never invoked that specific tool. With the fix, OpenClaw can keep the tool listed, keep its schema intact, and choose the compatibility mode that lets the turn proceed.

That is the right tradeoff. The tool surface should not disappear, and OpenClaw should not mutate the author's schema to fit one provider's strict-mode subset.

## Evidence From the PR

The PR includes a live route proof using OpenClaw's OpenAI Responses transport. Before the change, the affected tool was sent with `strict=true` and the request failed with a schema error. After the change, the same tool was sent with `strict=false`, the pattern stayed unchanged, and the assistant replied successfully.

Tests now cover the issue schema, each lookaround form, and controls for compatible regex patterns. A wire-level loopback test also verifies that the Responses request sends the tool with `strict: false` while preserving the schema.

## Bottom Line

This is a small patch with a very practical outcome: OpenAI sessions should stop failing just because one available tool has a reasonable regex guard in its schema.

For anyone running OpenClaw with MCP tools, file-creation tools, or provider-mixed routes, PR #166999 is the kind of compatibility fix that prevents one edge-case schema from taking down the whole turn.
