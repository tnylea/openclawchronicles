---
title: "OpenClaw Fixes Android Talk STT-TTS Voice Mode"
excerpt: "OpenClaw merged an Android Talk fix so on-device speech recognition sends turns and STT-TTS uses the configured voice."
coverImage: '/assets/images/posts/openclaw-2026-9-16-android-talk-stt-tts-fix.png'
date: '2026-09-16T23:06:00.000Z'
dateFormatted: September 16th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-16-android-talk-stt-tts-fix.png'
---

OpenClaw merged a P1 Android Talk fix today for two related voice problems. [PR #150175](https://github.com/openclaw/openclaw/pull/150175), "fix(android): Talk keeps beeping without replying and ignores the stt-tts voice mode," closes issues #150105 and #150104.

The user-facing version is straightforward: Android Talk now sends recognized speech instead of looping on the recognizer beep, and `talk.realtime.mode: "stt-tts"` routes through the configured Talk speech provider and voice.

## What Was Broken

The first bug affected on-device speech recognition. Native Talk restarted the recognizer as soon as speech ended. Google's recognizer delivers its final hypothesis when the session closes, so the immediate restart cancelled the session before `onResults` arrived.

That cancellation produced an `ERROR_CLIENT`, cleared the listening state, and caused the silence check to skip sending. Users would hear repeated recognizer beeps but never get a reply.

The second bug was a routing mismatch. Android always used the Gateway relay, which carries realtime sessions. But `stt-tts` uses a different path: device speech-to-text, then `chat.send`, then `talk.speak`.

## What Changed

The Android fix removes the premature restart at end-of-speech. `onResults` and `onError` already restart the recognizer, so the earlier restart was not just redundant; it was racing the final result.

For `stt-tts`, Android now routes to native Talk. That means:

- Device STT captures the user's speech
- Android sends the turn through `chat.send`
- OpenClaw replies
- `talk.speak` uses the configured speech provider and voice

The default realtime mode is unchanged. The PR also notes that production code is net zero lines: 11 removed and 11 added.

## Validation

The current head passed OpenClaw's CI run 35144123427, including Play, third-party and Wear unit tests, lint, ktlint, and the required CI gate. Independent P0-P2 review found no actionable findings.

The focused tests cover both bugs:

- `nativeTalkKeepsRecognitionOpenFromEndOfSpeechUntilResults`
- `routesSttTtsModeToNativeTalkEvenWhenRelayIsSupported`

The PR says each test fails on `main` and passes with the fix. Before the final rebase, `./gradlew :app:testPlayDebugUnitTest :app:ktlintCheck` passed 3,277 tests with zero failures. After rebasing, the voice package and ktlint passed again.

There is also live device evidence from a OnePlus 8T on Android 14. With `stt-tts` and an OpenAI-compatible local TTS server configured, three out of three turns were sent and spoken after the fix.

## Remaining Edges

The PR is careful about what it does not cover. Native Talk can still play the system recognizer start beep on each no-speech restart, and Talk setup readiness still reflects the realtime provider rather than the `stt-tts` provider path. Those are tracked separately.

Even with those caveats, this is a meaningful voice usability fix. Android Talk should now behave like a conversation instead of a loop of starts, stops, and missed final transcripts.

Source: [OpenClaw PR #150175](https://github.com/openclaw/openclaw/pull/150175).
