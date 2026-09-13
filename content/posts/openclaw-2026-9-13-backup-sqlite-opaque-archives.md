---
title: "OpenClaw Backups Preserve Foreign SQLite Files"
excerpt: "OpenClaw backups now preserve unmanaged SQLite files as opaque bytes, reducing failed archives when apps keep their own local databases."
coverImage: '/assets/images/posts/openclaw-2026-9-13-backup-sqlite-opaque-archives.png'
date: '2026-09-13T08:00:00.000Z'
dateFormatted: September 13th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-13-backup-sqlite-opaque-archives.png'
---

OpenClaw merged a backup reliability fix this morning that should matter to anyone keeping extra app state inside an OpenClaw workspace. [PR #146700](https://github.com/openclaw/openclaw/pull/146700), titled `fix(backup): archive unmanaged SQLite files as opaque bytes`, changes how the backup command treats SQLite files that are present in the tree but are not owned by OpenClaw core or a declared plugin resource.

The short version: unrelated SQLite files should no longer be able to sink the whole backup just because their internal schema or foreign-key state is not something OpenClaw manages.

## What Changed

Before this fix, a structurally valid SQLite file with foreign-key violations could cause backup creation to fail. That is a sharp edge for users who keep local tools, imported data, sidecar apps, or custom automation state near their OpenClaw workspace.

The merged change draws a cleaner line between managed databases and opaque files:

- Core and declared plugin databases still use the live-database snapshot path.
- Undeclared SQLite files are archived byte-for-byte.
- Backup verification and restore treat those unmanaged files as opaque payloads.
- Foreign SQLite symlink loops are skipped with filename warnings.
- Corrupt managed databases and unavailable plugin SQLite capabilities still block publication.

That is the right conservative split. OpenClaw should deeply validate state it owns, but it should not pretend to understand every database-shaped file a user happens to keep nearby.

## Why It Matters

Backups are only useful if users can trust them during the messy parts of real life. Workspaces accumulate helper files, local experiments, imported exports, plugin data, and odd little database files created by tools outside the main runtime. A backup command that fails on an unrelated database can make users choose between moving files around or skipping the archive.

This fix reduces that friction. It keeps OpenClaw strict where strictness protects recovery, while making unrelated files survive the trip unchanged.

The PR also calls out fleet backup behavior. Fleet backups now use the shared archive metadata adapter to preserve independent hardlink entries without stalling, which is especially useful for operators managing more than a single local setup.

## Compatibility Notes

The contributor states that the archive format, schema, plugin fields, and flags are unchanged. Existing `backupResources` declarations remain the authority for managed plugin data.

That matters because this is a compatibility fix rather than a new backup format. Operators should not need to update declarations just to benefit from safer handling of stray SQLite files.

## Verification

The PR includes a before-and-after CLI proof. The original command failed on a valid but foreign SQLite database with a foreign-key violation. The candidate preserved seven foreign files and sidecars byte-for-byte through create, verify, and restore.

The tests also covered sustained writes during backup, hardlinks with WAL data, symlink loops, older-schema cases, and managed-database refusal paths. OpenClaw still refuses to publish archives when state it owns is corrupt or unavailable.

This is not the flashiest kind of OpenClaw change, but it is the kind that pays rent: fewer surprising backup failures, clearer ownership rules, and better odds that a recovery archive contains the user files it should.
