---
title: "OpenClaw Adds Stdout Diagnostics OTEL Export"
excerpt: "OpenClaw now supports stdout diagnostics OTEL logs, giving operators JSONL observability without requiring an OTLP log sink."
coverImage: '/assets/images/posts/openclaw-diagnostics-otel-stdout-exporter.png'
date: '2026-06-19T08:15:00.000Z'
dateFormatted: June 19th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-diagnostics-otel-stdout-exporter.png'
---

OpenClaw merged a larger diagnostics update this morning: PR [#94561](https://github.com/openclaw/openclaw/pull/94561) adds a stdout log exporter to the diagnostics OTEL extension.

The new configuration field is `diagnostics.otel.logsExporter`, with three modes: `otlp`, `stdout`, and `both`. OTLP remains the default, but operators can now send diagnostics logs to stdout as JSONL, or duplicate them to both OTLP and stdout.

## Why This Matters

OpenTelemetry is powerful, but not every OpenClaw deployment has a full OTLP log pipeline ready. Some self-hosted operators rely on container logs, systemd journals, Kubernetes log collectors, or a simpler stdout-based aggregation stack.

That makes stdout export useful for a few common setups:

- Docker and Compose deployments where stdout is already collected.
- Kubernetes clusters with log agents tailing container output.
- Local development where operators want readable emitted records without standing up a collector.
- Security and QA environments where artifacts need to preserve exact emitted log lines.

The important detail is that stdout mode is not a separate, weaker log path. The PR says stdout JSONL goes through the same diagnostics-otel log-record build path as OTLP, including redaction, content-capture rules, attribute filtering, security events, and trusted trace fields.

## The New Export Modes

The new `diagnostics.otel.logsExporter` field supports three choices:

- `otlp`: send diagnostics logs through the existing OTLP path.
- `stdout`: write diagnostics log records as stdout JSONL.
- `both`: emit the same diagnostics logs to OTLP and stdout.

The PR also changes stdout-only behavior so logs no longer depend on the OTLP protocol setting when traces, metrics, and OTLP logs are off. That is a clean operator experience: if the goal is stdout logs, users should not need to keep an OTLP log sink configured just to activate the diagnostics path.

## Built For QA Evidence

This change also strengthens OpenClaw's QA story. The pull request adds QA Lab smoke scenarios for stdout-only and dual OTLP-plus-stdout log export, preserving sanitized gateway stdout artifacts so the wrapper can verify real emitted JSONL records.

The proof table in the PR is unusually concrete. The stdout smoke path passed with `stdoutLogs=16` and `logs=0`, showing that stdout received the diagnostics logs while OTLP logs did not. The `both` mode passed with `stdoutLogs=16` and `logs=16`, showing dual delivery.

That split matters. It verifies the configuration actually controls the sink rather than merely enabling or disabling diagnostics globally.

## Safer Observability Defaults

Agent observability has a privacy problem: logs are most useful when they are detailed, but detailed agent logs can easily include sensitive context. This PR is notable because it routes stdout output through the same redaction and content-capture rules as the OTLP path.

Operators should still treat diagnostics logs as sensitive operational data, but sharing one log-record builder across sinks is the right shape. It avoids a situation where OTLP records are filtered carefully while stdout records accidentally expose more.

## The Bottom Line

OpenClaw PR [#94561](https://github.com/openclaw/openclaw/pull/94561) is a strong operations feature. It makes diagnostics logs easier to consume in ordinary infrastructure while keeping the existing OTEL path intact.

For teams already collecting stdout, this lowers the bar for OpenClaw observability. For teams with OTLP pipelines, `both` mode gives a practical bridge between collector-based telemetry and direct QA artifacts.
