---
title: "OpenClaw Restores iOS Builds With WebRTC 152"
excerpt: "OpenClaw iOS builds now resolve again after moving to WebRTC 152, restoring Swift package downloads without weakening verification."
coverImage: '/assets/images/posts/openclaw-2026-9-1-ios-webrtc-152-builds.png'
date: '2026-09-01T08:01:00.000Z'
dateFormatted: September 1st 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-9-1-ios-webrtc-152-builds.png'
---

OpenClaw merged a P1 iOS build repair this morning that moves the app's WebRTC dependency to the separately versioned 152 release. [PR #134942](https://github.com/openclaw/openclaw/pull/134942), `fix(ios): restore dependency resolution with WebRTC 152`, addresses a broken Swift package resolution path caused by a changed upstream WebRTC 151 publication and a disappeared binary download.

The visible effect is simple: iOS developers should be able to resolve and build the OpenClaw app normally again. The important detail is how the fix gets there. The PR does not override trust records, skip checksum validation, or loosen verification policy. It advances the dependency to WebRTC 152 and keeps the usual source fingerprint and artifact checksum checks in place.

## What Broke

OpenClaw's iOS app depends on a prebuilt WebRTC package. The PR explains that previously trusted 151 installations could reject the changed upstream fingerprint, while fresh Swift package resolution reached a deleted artifact. That combination created a sharp failure mode for developers setting up or rebuilding the iOS app.

The maintainer also investigated the apparent smaller move to WebRTC 151.0.1. That option was rejected because its package manifest still pointed at the missing 151.0.0 binary URL. In other words, changing only to 151.0.1 would not repair the download path that was actually failing.

## The Fix

OpenClaw now points the iOS dependency at WebRTC 152.0.0. The PR reports that strict SwiftPM resolution selected commit `1d04692697cb642bfebf6ad2dd99fe52649c3d6d`, downloaded a 44,701,370-byte archive, and matched the expected SHA256 checksum from the immutable package manifest.

The audit covered five package manifests, two committed lockfiles, and the iOS XcodeGen project. Thirty-three external packages were checked. The iOS 18 minimum remains unchanged, and the change is described as one manifest line with zero net production or test line growth.

The PR also keeps nearby dependency decisions explicit. Peekaboo and MLX Audio revisions were left alone because their tagged releases predate OpenClaw-specific packaging and streaming behavior the app consumes.

## Why It Matters

This is not a feature headline, but it is the kind of maintenance that keeps native OpenClaw work moving. A broken package artifact can block fresh contributors, CI runners, and local app rebuilds even when the application code is fine.

The repair also matters because it preserves the trust model. Dependency failures often tempt quick cache or checksum workarounds. This PR instead moves to a release whose artifact can be fetched and verified normally.

For users, the downstream benefit is quieter: iOS Talk and app work can continue without developers fighting Swift package resolution first.

## Proof From The Merge

The merged PR reports an actual iOS simulator app build, six existing transcript, ordering, and license tests, and a temporary XCTest that exercised a real WebRTC 152 peer pair through offer/answer, ICE, DTLS/SCTP data-channel request and reply, channel closure, and peer closure.

Exact-head CI also passed, including the iOS build, iPhone and iPad screenshot checks, and the required CI gate. The proof boundary is clear: this validates simulator build/load and local native transport behavior. It does not claim physical microphone or speaker proof, live-provider call coverage, reproducible-binary proof, or binary equivalence.

## Operator Takeaway

OpenClaw's iOS app should once again resolve its WebRTC package through normal SwiftPM flow. The project moved to WebRTC 152 because the older 151 artifact path was no longer reliable, and the merge keeps checksum and fingerprint verification intact.
