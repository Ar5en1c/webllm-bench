# Launch Copy v1.0.0 (Claim-Safe)

Date: 2026-03-28
Source metrics: `reports/launch_8k_batch_validation_2026-03-28.md`

## 1) GitHub Release

### Title
`WebLLM Bench v1.0.0 + Qwen2.5-1.5B ctx8192 validation`

### Body
```
WebLLM Bench v1.0.0 is now public.

What ships:
- Browser-native local LLM toolkit: benchmark, chat, side-by-side compare, best-model sweep, baseline import/export
- Custom model registry support for MLC/WebLLM artifacts
- Reproducible 8k context validation workflow for Qwen2.5-1.5B

8k validation summary (measured):
- Included exports: 8 (8k custom vs 4k baseline pairs)
- Fixed profile: promptTokens=1024, maxTokens=128, iterations=10
- Browser families in exports: Chrome-family, Safari
- Median delta (8k vs 4k):
  - Decode TPS: +0.11%
  - Throughput: -0.06%
  - Latency: +0.09%
  - Token parity: 1.000
- Range:
  - Decode delta: -0.53% .. +1.58%
  - Latency delta: -1.33% .. +0.48%

Functional context gate:
- 8k build passes >4k retrieval prompt checks
- 4k baseline overflows at 5813 prompt tokens (context window size 4096)

Important limitation:
- Browser WebGPU does not provide exact live GPU VRAM counters. VRAM numbers are model metadata/proxy signals.

Reproduce:
- npm run test
- npm run report:8k:batch
- npm run launch:draft

Report:
- reports/launch_8k_batch_validation_2026-03-28.md
```

## 2) X Thread (Exact Copy)

### Post 1
```
Open-sourcing WebLLM Bench v1.0.0.

A browser-native local LLM toolkit for:
- benchmark
- chat
- side-by-side compare
- best-model sweep
- baseline import/export

Plus a reproducible ctx8192 validation workflow for Qwen2.5-1.5B.
```

### Post 2
```
8k validation on fixed profile (1024 prompt / 128 output / 10 iterations), using 8 exported runs:

Median delta (8k custom vs 4k baseline):
- Decode TPS: +0.11%
- Throughput: -0.06%
- Latency: +0.09%
- Token parity: 1.000
```

### Post 3
```
Range across included runs:
- Decode delta: -0.53% .. +1.58%
- Latency delta: -1.33% .. +0.48%

Interpretation: parity band, no material regression on this profile.
```

### Post 4
```
Functional gate result:
- ctx8192 build handles >4k retrieval prompts
- ctx4096 baseline fails at 5813 prompt tokens with context overflow

So this is not only a config change; it is validated long-context behavior.
```

### Post 5
```
Limitation (explicit):
Browser WebGPU does not expose exact live VRAM usage counters.

Published VRAM numbers are model metadata / proxy signals, not hardware telemetry.
```

### Post 6
```
Everything is reproducible from repo artifacts:
- benchmark JSON exports
- validation protocol
- batch report generator

Commands:
npm run test
npm run report:8k:batch
npm run launch:draft
```

## 3) LinkedIn Post (Exact Copy)

```
We are open-sourcing WebLLM Bench v1.0.0.

This release includes a browser-native local LLM toolkit (benchmark, chat, side-by-side compare, best-model sweep, and baseline import/export) and a reproducible ctx8192 validation workflow for Qwen2.5-1.5B.

Measured 8k result on a fixed benchmark profile (1024 prompt tokens, 128 output tokens, 10 iterations), aggregated across 8 exported runs:
- Decode TPS delta (8k vs 4k): +0.11%
- Throughput delta: -0.06%
- Latency delta: +0.09%
- Token parity: 1.000

Range across runs:
- Decode delta: -0.53% to +1.58%
- Latency delta: -1.33% to +0.48%

Functional context check also passed:
- ctx8192 build handled prompts beyond 4k context
- ctx4096 baseline overflowed at 5813 prompt tokens

One limitation to state clearly: browser WebGPU does not expose exact live VRAM counters, so VRAM values are metadata/proxy signals.

All claims are backed by exported JSON reports and a reproducible validation script in the repository.
```
