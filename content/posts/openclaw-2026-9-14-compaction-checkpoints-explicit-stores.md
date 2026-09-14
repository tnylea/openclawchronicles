---
title: "OpenClaw Preserves Explicit Store Checkpoints"
excerpt: "OpenClaw PR #148489 keeps compaction checkpoint metadata in the selected SQLite session store, avoiding warnings and lost history."
coverImage: '/assets/images/posts/openclaw-2026-9-14-compaction-checkpoints-explicit-stores.png'
date: '2026-09-14T23:10:00.000Z'
dateFormatted: September 14th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-14-compaction-checkpoints-explicit-stores.png'
---

OpenClaw merged [PR #148489](https://github.com/openclaw/openclaw/pull/148489), a compaction reliability fix for agents that use an explicit SQLite session store different from the Gateway's configured store.

The bug was easy to miss but important for long-running sessions. Compaction could complete, yet checkpoint metadata could be missing or produce checkpoint-persistence warnings because the checkpoint helper looked up the store configuration again instead of using the selected transcript target.

## The Store Mismatch

Compaction checkpoint metadata is useful because it records where a compacted session can safely continue. If an agent is running against an explicit SQLite target, the checkpoint should be written beside that selected transcript.

The PR explains that both compaction entry points now carry their resolved session target through the checkpoint helper and store. The store no longer redirects through configuration lookup at checkpoint time, which prevents writes from heading toward the wrong database or failing the writer-ownership check.

The repair keeps the existing ownership boundaries intact:

- Cancellation behavior is unchanged.
- Current-writer validation remains in place.
- Checkpoint retention keeps its existing owner.
- Legacy checkpoint restoration is preserved.
- No schema migration or configuration change is required.

## User Impact

For users, this is about keeping context recovery boring. When compaction happens against an explicit SQLite store, checkpoint history should remain available after the compaction rather than becoming a warning that has to be interpreted later.

That matters most in setups where multiple stores exist for good reasons: isolated agents, testing environments, local state splits, or Gateway configurations that are not the same as the active session target. In those cases, "use the selected store" is the least surprising behavior.

## Validation

The PR reports that existing direct-compaction and queued-compaction fixtures were changed to use distinct configured and selected stores. Five cases failed on the original code, including a queued cancellation case, then passed with the fix.

The maintainer also reports 44 focused compaction, ownership, branch, and restore tests passing. Full build and changed-code checks passed, and independent review found no actionable P0-P2 findings.

There was also a live provider probe using the OpenAI API with `gpt-4o-mini`. The test forced a `context_length_exceeded` response after a completed tool write, triggered one compaction, then continued successfully. The selected explicit SQLite target contained one checkpoint, emitted zero checkpoint warnings, and recorded the expected receipt and original request.

The PR is careful about scope: the live probe used synthetic history and isolated state, and it validates the production agent runner rather than claiming a production Gateway deployment.

## Why This Is Worth Covering

Compaction is one of the invisible support beams in agent software. Users mostly notice it when it goes wrong: lost context, strange continuation behavior, or warnings that suggest state was written somewhere unexpected.

PR #148489 tightens that support beam for explicit session stores. The selected transcript target now stays selected all the way through checkpoint persistence, which is the behavior operators would reasonably expect.
