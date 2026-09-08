---
title: "OpenClaw Reuses Prepared LLM Runtimes"
excerpt: "OpenClaw direct plugin completions now retain prepared LLM runtimes through execution, reducing duplicate preparation during overlapping requests."
coverImage: '/assets/images/posts/openclaw-2026-9-8-direct-llm-runtime-reuse.png'
date: '2026-09-08T08:15:00.000Z'
dateFormatted: September 8th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-8-direct-llm-runtime-reuse.png'
---

OpenClaw has tightened how direct plugin LLM completions hold prepared runtime state. [PR #141938](https://github.com/openclaw/openclaw/pull/141938), "fix(llm): retain prepared runtimes through direct completions," merged on September 8, 2026 at 07:52 UTC.

The repair targets overlapping direct completions. Before the change, preparation could release its lease before execution finished. In Gateway mode, that meant an active completion's owner could become eligible for LRU eviction, and overlapping requests could rebuild the same prepared model facts.

The new flow transfers the existing lease into the direct `runtime.llm.complete` operation and releases it only after completion and result processing.

## What Changed

The PR introduces an internal acquisition path that carries prepared runtime ownership across the actual direct completion. Failed construction or preparation releases internally, while successful direct completions keep the lease until the operation is done.

The public SDK preparation adapter keeps its existing return shape and immediate-release behavior. The PR explicitly says it adds no SDK export, configuration option, protocol change, physical database disposal, registration disposal, cache key, or cache size change.

The work changes two production owners plus related test fixtures. Isolated and worker inference keep their existing outer owners.

## Why It Matters

Prepared model facts are meant to avoid repeating expensive setup. If overlapping direct completions both rebuild preparation data, users do not get the full benefit of that preparation layer. Worse, a lease gap can make an active owner look unused to Gateway eviction logic.

This fix makes the ownership window match the work being performed. A prepared runtime used for a direct completion stays owned while that completion is in flight, then cleans itself up at the natural boundary.

The result is a more predictable runtime path for plugin authors and operators who depend on direct LLM calls inside OpenClaw.

## User Impact

The PR says overlapping completions now reuse their prepared generation while keeping independent mutable request stores. Configuration, credential publication, policy checks, provider errors, cancellation, and returned results retain their behavior.

That means users should see fewer redundant preparation passes in overlapping direct-completion cases without having to change configuration or plugin code.

The benchmark in the PR used a local synthetic SSE provider, so it should not be read as an end-to-end model-speed guarantee. The useful signal is behavioral: overlapping pairs moved from two generation builds to one in the candidate.

## Validation

The original production code failed three native cases: overlap reuse, in-use LRU eviction, and store-fork failure leaking ownership. Six configuration, authentication, error, and abort controls already passed.

After the repair, all nine cases passed alongside 129 runtime and command tests, 49 core and SDK compatibility tests, and the complete canonical changed checks.

The PR also reports a matched compiled probe against `createPluginRuntime().llm.complete`, run across separate Node 24 processes in baseline and candidate order. In that probe, generation builds per overlapping pair dropped from two to one while each pair still kept two independent request-store forks.
