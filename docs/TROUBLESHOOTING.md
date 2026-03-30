# Troubleshooting

## WebGPU not available

Symptom:
- App shows: `WebGPU not available. Use Chrome 113+ or Edge 113+.`

Fix:
1. Use latest Chrome/Edge desktop.
2. Verify hardware acceleration is enabled.
3. Retry in a clean tab/profile.

## Compare says prompt exceeds context window

Symptom:
- `Prompt tokens exceed context window size`

Cause:
- Prompt is longer than selected model context (e.g., >4096 on 4k model).

Fix:
1. Use custom 8k model for long prompts.
2. Reduce prompt length.
3. Use sliding window mode where applicable.

## Local custom model init fails

Symptom:
- Errors around local files/wasm load.

Fix:
1. Ensure required files exist: `mlc-chat-config.json`, `tokenizer.json`, `tensor-cache.json`, `params_shard_*.bin`.
2. Re-add local files after page reload (session-only).
3. Use matching `.wasm` for your model build.

## Safari is much slower

Symptom:
- Lower throughput and larger TTFT vs Chrome/Edge.

Fix:
1. Use `Safari Stable` preset.
2. Reduce prompt/output window.
3. For publishable benchmarks, run Chrome/Edge primary and include Safari secondary.

## VRAM numbers seem inconsistent

Explanation:
- Browser WebGPU does not expose exact live GPU VRAM usage.
- Treat VRAM as metadata/proxy signals.
