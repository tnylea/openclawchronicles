---
title: "OpenClaw Fixes Back-to-Back Channel Setup"
excerpt: "OpenClaw now lets users finish one channel setup and immediately start another without hitting an in-progress wizard error."
coverImage: '/assets/images/posts/openclaw-2026-9-28-channel-setup-back-to-back.png'
date: '2026-09-28T23:01:00.000Z'
dateFormatted: September 28th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-28-channel-setup-back-to-back.png'
---

OpenClaw merged a P0 Control UI fix Monday night that removes a nasty setup blocker for users adding several messaging channels in one sitting.

The change landed in [PR #160705](https://github.com/openclaw/openclaw/pull/160705), titled `fix(ui): let channel setups run back to back`. The bug affected the Channels page wizard: after finishing one setup, closing its final note could leave the Gateway wizard session alive. Starting the next channel then failed with the message, "OpenClaw setup is already in progress; try again when it finishes."

## What Broke

The PR gives a concrete reproduction path: finish Telegram setup, press Escape on the "Channels updated" note, then start Slack. A related race could happen when a quick restart after Discord's committed outro overtook cancellation.

For users, the symptom was simple and frustrating. OpenClaw had already completed the first setup, but the interface could still think setup was occupied. That blocked normal follow-on work like adding Slack, Discord, WhatsApp, or another channel immediately after the first one.

## What Changed

The controller previously closed the wizard with a plain `wizard.cancel`. The PR says the server-side wizard session refuses that cancel once the session's commit lock is taken. That left the durable wizard work committed, but the session itself could remain in the way of the next setup.

The fix switches the controller to the existing `closeInput` cancellation contract. That closes pending prompts without aborting durable committed work.

The controller also now keeps track of the in-flight cancellation and waits for it before starting a replacement wizard on the same client. The modal still closes immediately, but the next start no longer races ahead of cleanup.

## User Impact

The user-facing improvement is straightforward: close one channel wizard, start the next one, and it should open without the stale "already in progress" error.

That is especially important for first-time setup. A new OpenClaw installation often needs several channels configured back to back. The Channels page should feel like a checklist, not a trapdoor where finishing one item blocks the next.

## Boundaries

The PR does not change the Gateway protocol or configuration. It is a Control UI wizard-controller fix.

It also calls out two limitations that remain separate: reloading mid-wizard can still strand a server session, and separate work is tracking a sequential setup save stall plus stale channel cards after success.

## Evidence From Testing

The regression tests cover committed work, replacement ordering, and stalled cancel behavior. The controller suites passed 19 of 19 tests.

The PR also reports real isolated Gateway plus Chromium testing on a Blacksmith Testbox, with stubs for Telegram, Discord, Slack, and WhatsApp. All 50 cancel and restart checkpoints passed, with close-and-reopen timing measured across the four channel types.

For a P0 UI setup bug, that is the right kind of proof: the fix is small, but it is exercised through the actual workflow users hit.
