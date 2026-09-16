---
title: "OpenClaw Aligns Sandbox File Tools"
excerpt: "OpenClaw PR #148893 keeps file tools aligned with sandbox mounts across Docker, MXC, remote shell, and OpenShell."
coverImage: '/assets/images/posts/openclaw-2026-9-16-sandbox-overlapping-mounts.png'
date: '2026-09-16T08:04:00.000Z'
dateFormatted: September 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-16-sandbox-overlapping-mounts.png'
---

OpenClaw merged [PR #148893](https://github.com/openclaw/openclaw/pull/148893), a P2 sandbox compatibility fix for file tools, overlapping mounts, and backend-specific workspace paths.

The short version: file tools should read, write, list, and patch the same backing files that sandbox commands can see. Before this change, overlapping mounts and backend path mappings could make those two views disagree.

## What Changed

PR #148893 introduces one mount-selection owner for container creation, browser creation, retained-container checks, and file-tool resolution. A prepared kernel snapshot records visible mounts, then reads and file identity resolution select the container endpoint before checking host backing metadata.

That is a mouthful, but the user-facing behavior is simpler:

- File tools follow visible mounts and mapped symlink aliases.
- Backend-owned workspace namespaces remain authoritative.
- Native Windows and backend-specific paths are handled more consistently.
- Hidden or unverifiable backing paths are denied.
- Unchanged containers remain reusable, while changed hot mounts require scoped recreation.

The PR also adds an optional `SandboxFsBridge.pathMappings` SDK property so Docker, MXC, remote shell, and OpenShell can declare the actual host/container roots they own. Older bridges that omit the property keep the v2026.9.4 host-root compatibility path.

## Why It Matters

Sandboxing is only useful when the file boundary is boringly reliable. If a command sees one path and a file tool checks another, users can hit confusing failures: valid files rejected, local file URLs checked through the wrong identity, or equivalent Windows paths treated as different files.

This fix matters most for advanced workspace setups where mounts overlap, aliases exist, or tools are running through a nontrivial backend. Those are exactly the setups where a small path mismatch can become a long debugging session.

The PR keeps workspace restrictions and backend-owned permissions in place. It does not grant new physical access. Instead, it makes the admission path follow the same visible mount model the sandbox is already using.

## The Proof

The PR includes broad regression coverage. It describes production changes across sandbox admission, bridge mappings, native path handling, and mount identity. It also notes that Docker, MXC, remote shell, and OpenShell now provide their actual mappings for shared admission.

The evidence list covers canonical reads, covered mounts, backend mappings, local file URLs, native Windows identities, and protected skill mount fixtures. The PR is labeled as a compatibility-risk change, which fits the surface area: the whole point is making the compatibility boundary explicit rather than accidental.

## What To Watch

The biggest behavior change is stricter denial for hidden or unverifiable backing. That is the right shape for a sandbox, but it may expose old integrations that relied on implicit host-root interpretation.

For most users, the expected result is less surprising file behavior. For plugin and backend authors, the signal is clear: publish accurate path mappings so file tools and sandbox commands stay in the same world.
