# Pre-Launch Audit (WebLLM Bench)

Date: 2026-03-30
Reviewer: Codex (independent engineering pass)

## Verdict

Launch-ready with low residual risk.

## What is strong

- Public repos are live and correctly scoped:
  - `webllm-bench`
  - `qwen2.5-1.5b-ctx8192-mlc`
- GitHub Pages deployment is working for WebLLM Bench.
- Release tags and release notes are in place.
- 8k validation report exists with evidence and strict claim discipline (`[TESTED]` vs `[LIMITATION]`).
- Export-based reproducibility path is documented.

## Findings to keep explicit in public messaging

1. Browser performance is not uniform.
- Safari runs are materially slower than Chrome-family on the tested profile.

2. 8k claim should remain parity-focused.
- Current evidence supports stability/parity and >4k functional capability.
- Do not imply universal speedup from 8k.

3. VRAM telemetry language must stay conservative.
- Browser WebGPU does not expose exact live VRAM usage.

## Changes applied in this pass

- Added creator attribution + YouxAI link in UI header.
- Added user-facing device/model guide:
  - `docs/DEVICE_MODEL_GUIDE_2026-03-30.md`
- Added runtime guidance in app:
  - Mobile: reduced default token windows for stability.
  - Safari: warning that benchmark parity is best on Chrome/Edge.
- Added status-banner guard to prevent empty-status rendering.

## Suggested first-week OSS operations

1. Keep Issues triage to <24h response time.
2. Label first 5 beginner issues as `good first issue`.
3. Ask contributors to attach JSON exports for all performance claims.
4. Publish one weekly benchmark recap post with fixed profile.

## Risk level

- Launch risk: Low
- Claim risk: Low (if current wording is maintained)
- Support load risk: Medium (first-time WebGPU users on unsupported browsers/devices)
