---
title: "OpenClaw Adds Hosted Catalog Snapshot Fallback"
excerpt: "OpenClaw's hosted marketplace feed path now has guarded fetches and last-known-good snapshots, making ClawHub catalog reads safer."
coverImage: '/assets/images/posts/openclaw-2026-6-27-hosted-catalog-snapshots.png'
date: '2026-06-27T23:00:00.000Z'
dateFormatted: June 27th 2026
authorName: Cody
authorPicture: 'https://cdn.devdojo.com/images/march2026/cody.jpg'
ogImageUrl: '/assets/images/posts/openclaw-2026-6-27-hosted-catalog-snapshots.png'
---

OpenClaw's marketplace work took a concrete step forward tonight with a pair of merged pull requests that make hosted catalog data safer to fetch and safer to reuse. [PR #95868](https://github.com/openclaw/openclaw/pull/95868) added the guarded hosted feed loader, while [PR #95877](https://github.com/openclaw/openclaw/pull/95877) layered in a last-known-good snapshot fallback for the same feed path.

The work does not immediately switch plugin installs or search to a live remote source. That restraint is the point. OpenClaw is laying down the transport and fallback contract first, so a hosted ClawHub feed can be tried without making startup, search, or install behavior brittle.

## What Changed

The new hosted loader targets the public ClawHub plugin feed at `https://clawhub.ai/v1/feeds/plugins`. It requires HTTPS, uses the existing SSRF guard, constrains the allowed public feed host, reads responses with byte and timeout limits, and validates hosted JSON against the feed-shaped official catalog schema.

If the hosted response is unsafe or unusable, OpenClaw falls back to the bundled catalog. That covers network failures, status errors, checksum mismatches, oversized bodies, invalid JSON, and schema failures.

The follow-up snapshot PR adds a second fallback layer. After a successful hosted load, OpenClaw can store the exact response body plus metadata. Later requests can reuse that accepted snapshot when the hosted endpoint returns `304 Not Modified`, fails, or returns an invalid body, as long as the snapshot still validates.

The intended order is now:

- Hosted feed first
- Validated last-known-good snapshot second
- Bundled catalog last

## Why It Matters

Marketplace catalogs sit close to a trust boundary. They tell OpenClaw what plugins exist, where they come from, and eventually which candidates may be presented to users. A live catalog feed is useful only if the failure modes are boring.

These PRs make the boring path explicit. Hosted data must pass the network guard, size limits, checksum handling, schema validation, and feed metadata checks. Cached snapshots must validate before use. If those checks fail, OpenClaw keeps the known bundled catalog path.

That matters because the broader marketplace roadmap is still unfolding. The PR stack described in #95877 includes persistent snapshots, marketplace source profiles, manual refresh commands, entry listing commands, and telemetry. The current merge does not skip ahead to those product surfaces; it defines how hosted feed data is accepted before it is allowed to influence more user-visible workflows.

## Live Feed Proof

The maintainers included live proof against the ClawHub feed. PR #95868 reported a successful hosted response with 59 entries, feed id `clawhub-official`, schema version 1, sequence 16, and a SHA-256 checksum for the response body.

PR #95877 then tested the snapshot behavior against the same live feed. The first request loaded and persisted the hosted response. The second request sent the feed's ETag as `If-None-Match`, received HTTP 304, validated the saved snapshot, and returned it as `hosted-snapshot` with the same 59-entry feed.

That is the behavior operators want from a marketplace feed: use the network when it is fresh and healthy, but do not break the catalog just because the network is unchanged or temporarily unreliable.

## What Is Still Ahead

This is still infrastructure, not the final marketplace experience. The merged PRs intentionally do not choose the production persistence location, add signed envelopes, enable hosted loading by default, interpret install candidates, add source profiles, or change plugin install/search behavior.

Those decisions are queued in the rest of the hosted marketplace feed stack. The important thing tonight is that OpenClaw now has a guarded hosted feed path and a validated snapshot contract underneath it. That makes the next marketplace features easier to ship without turning catalog freshness into a new reliability problem.
