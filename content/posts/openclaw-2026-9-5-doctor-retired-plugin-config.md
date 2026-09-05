---
title: "OpenClaw Doctor Fixes Plugin Config Startup"
excerpt: "OpenClaw Doctor now removes retired plugin install config safely, preserving records so strict Gateway services can start again."
coverImage: '/assets/images/posts/openclaw-2026-9-5-doctor-retired-plugin-config.png'
date: '2026-09-05T08:10:00.000Z'
dateFormatted: September 5th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-5-doctor-retired-plugin-config.png'
---

OpenClaw has merged a Doctor repair for a strict Gateway startup failure tied to retired plugin install configuration. [PR #138914](https://github.com/openclaw/openclaw/pull/138914), "fix(doctor): unblock service startup with retired plugin config," landed at 06:32 UTC on September 5, 2026.

The issue was specific but painful for affected operators. `openclaw doctor --fix` could leave the retired `plugins.installs` key in configuration, allowing Doctor itself to exit successfully while a strict Gateway service still failed with code 78. When a last-known-good backup existed, recovery could also restore the backup before newer install records had been imported.

## Why The Ordering Mattered

Plugin install records are not just cosmetic config. They tell OpenClaw what was installed, where it came from, and which provenance should be preserved. A repair that simply deletes an old key too late can make startup pass while losing pending records, or can preserve malformed input without explaining why strict startup still refuses it.

The merged fix moves validated legacy record import into Doctor config preparation before plugin discovery, config repair, or package cleanup. It preserves existing canonical records and official provenance, removes the retired key through the normal config writer, and validates the accepted source while holding the writer lock.

The PR also prevents backup recovery from discarding pending install records. That is the important recovery detail: Doctor can clean the obsolete shape without replaying records after cleanup or dropping install state that still belongs in the canonical ledger.

## User Impact

For users and operators, the practical outcome is that Doctor is more likely to leave the system in a state the strict Gateway service can actually boot from.

- Empty retired maps are removed so health and readiness pass.
- Populated maps import complete records before the old key disappears.
- Older backups no longer discard pending install records during repair.
- Include-owned configs keep their include relationship while removing the retired key.
- Repeated Doctor and startup runs keep the key absent and the records intact.

The PR explicitly says it adds no new configuration option, runtime schema key, database schema, database version, or protocol change. This is a repair to migration and write ordering, not a new plugin system surface.

## Evidence From The PR

The PR reports failing process regressions before the repair and passing results afterward across empty and populated maps, existing indexes, canonical precedence, includes, malformed sources, cleanup ordering, and enabled custom-path settings.

It also includes installed-package service proof using `dist/entry.js gateway --port ...` with the canonical service marker and non-interactive streams. The proof used neither `--dev` nor `--allow-unconfigured`, which matters because the bug appeared in strict startup admission rather than a relaxed development mode.

Validation covered focused config, migration, provenance, contribution, and write-projection suites. Runtime prerequisite routing passed all 44 prerequisite cases, and the final scope included 394 added test lines against 191 added and 62 removed production lines.

The remaining caveat is platform-specific: native Windows Task Scheduler was not available in the approved proof fixture. The PR instead documents source inspection of the Windows supervision path and notes that it launches the same strict Gateway admission path. For the core Doctor repair, the key result is clear: OpenClaw now transfers legacy plugin install records before it removes the retired config key that could block service startup.
