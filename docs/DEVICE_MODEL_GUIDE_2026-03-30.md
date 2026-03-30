# Device + Model Guide (Tested)

Date: 2026-03-30

This guide is based on exported WebLLM Bench runs in `reports/` and is written for public users picking models by browser/device.

## Evidence Sources

- `reports/launch_8k_batch_validation_2026-03-28.md`
- `reports/webllm-bench-2026-03-28T203438865Z.json`
- `reports/webllm-bench-2026-03-28T204320338Z.json`
- `reports/webllm-bench-2026-03-28T213858736Z.json`
- `reports/webllm-bench-2026-03-28T214344099Z.json`
- `reports/webllm-bench-2026-03-28T221747842Z.json`
- `reports/webllm-bench-2026-03-28T222207852Z.json`
- `reports/webllm-bench-2026-03-28T224607779Z.json`
- `reports/webllm-bench-2026-03-28T225258569Z.json`

## Tested Performance Snapshot

Profile for parity runs:
- `promptTokens=1024`
- `maxTokens=128`
- `iterations=10`

| Browser Family | Model | Decode TPS | Throughput | TTFT | Notes |
|---|---|---:|---:|---:|---|
| Chrome-family | Qwen2.5-1.5B-Instruct (4k) | 19.49 | 14.38 tok/s | 2.30s | Stable baseline |
| Chrome-family | Qwen2.5-1.5B custom (8k) | 19.63 | 14.44 tok/s | 2.31s | Parity with 4k baseline |
| Chrome-family | Qwen3-1.7B | 26.65 | 17.07 tok/s | 2.66s | Faster decode, higher VRAM |
| Safari | Qwen2.5-1.5B-Instruct (4k) | 14.66 | 8.27 tok/s | 6.67s | Works, slower than Chrome-family |
| Safari | Qwen2.5-1.5B custom (8k) | 14.68 | 8.28 tok/s | 6.67s | 8k still parity vs 4k |

## Interpretation

- [TESTED] The custom 8k Qwen2.5-1.5B build remains in parity band with the official 4k build.
- [TESTED] Safari is slower than Chrome-family on this workload.
- [TESTED] Qwen3-1.7B decode is faster than Qwen2.5-1.5B in the captured Chrome-family run.
- [LIMITATION] Browser WebGPU does not expose exact live GPU VRAM usage.

## Which Model Should I Use?

### 1) Desktop/Laptop (Chrome or Edge)
- Start with: `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`
- Use custom 8k build when your prompts exceed 4k context.
- If you prioritize decode speed over size, try `Qwen3-1.7B`.

### 2) Safari Users
- Model compatibility is fine, but expect lower speed.
- Prefer smaller prompt/output windows for smooth UX.
- For reproducible benchmark sharing, run Chrome/Edge and include Safari runs as secondary evidence.

### 3) Mobile Users (Experimental)
- Prefer <=1.5B models.
- Keep prompts short and output capped.
- Use quick profile first before long runs.

## Recommended Presets

### Quick Smoke Test
- `promptTokens=512`
- `maxTokens=64`
- `iterations=3`

### Publish-Grade Parity Test
- `promptTokens=1024`
- `maxTokens=128`
- `iterations=10`
- `force full max tokens=ON`

### Long-Context Functional Gate
- Compare custom 8k model vs 4k baseline using a prompt >4096 tokens.
- Expect 8k to run and 4k to fail with context overflow.

## What to Include in Shared Results

1. Browser + version
2. Full benchmark profile
3. Exported JSON
4. Screenshot of result table + log
5. Clear `[TESTED]` vs `[INFERENCE]` wording
