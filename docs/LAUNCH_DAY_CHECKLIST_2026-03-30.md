# Launch Day Checklist (WebLLM Bench + Qwen2.5 ctx8192)

## 1) Final links

- Live app: `https://ar5en1c.github.io/webllm-bench/bench.html`
- WebLLM Bench repo: `https://github.com/Ar5en1c/webllm-bench`
- 8k workflow repo: `https://github.com/Ar5en1c/qwen2.5-1.5b-ctx8192-mlc`
- HF hosted 8k model: `https://huggingface.co/Ar5en1c/Qwen2.5-1.5B-Instruct-q4f16_1-MLC-ctx8192`

## 2) Claims to use (and only these)

- Fixed-profile parity (`1024/128/10`): median deltas stay around parity band.
- Long-output parity (`1024/512/5`):
  - Throughput delta (8k vs 4k): `-1.96%`
  - Latency delta: `+1.94%`
  - Decode delta: `-1.98%`
  - TTFT delta: `+0.63%`
- Functional gate:
  - 8k handles >4k retrieval prompts
  - 4k fails at 5813 prompt tokens (ctx 4096)
- Limitation:
  - Browser WebGPU does not expose exact live GPU VRAM telemetry.

## 3) Post order (same day)

1. GitHub release (both repos)
2. X thread
3. LinkedIn post
4. r/LocalLLaMA post
5. WebLLM/MLC Discord post
6. Hacker News post

## 4) Channel-ready short copy

### Reddit (r/LocalLLaMA) title

`[OSS] WebLLM Bench v1.0.0 + Qwen2.5-1.5B ctx8192 hosted preset (parity-tested vs official 4k build)`

### Reddit body

`Open-sourced two repos:

- WebLLM Bench (browser-native benchmark/chat/compare): https://github.com/Ar5en1c/webllm-bench
- Qwen2.5-1.5B ctx8192 workflow package: https://github.com/Ar5en1c/qwen2.5-1.5b-ctx8192-mlc
- Live app: https://ar5en1c.github.io/webllm-bench/bench.html
- HF hosted model: https://huggingface.co/Ar5en1c/Qwen2.5-1.5B-Instruct-q4f16_1-MLC-ctx8192

Measured on fixed profile (1024/128/10): parity band vs official 4k baseline.
Latest long-output stress run (1024/512/5): throughput delta -1.96%, latency +1.94%, decode -1.98%, TTFT +0.63%.

Functional gate: 8k handles >4k retrieval prompts; 4k baseline overflows at 5813 tokens.

Limitation: browser WebGPU doesn’t expose exact live GPU VRAM telemetry, so VRAM values are model metadata/proxy signals.`

### Discord short post

`Released: WebLLM Bench v1.0.0 + hosted Qwen2.5-1.5B ctx8192 preset.
Live: https://ar5en1c.github.io/webllm-bench/bench.html
Repo: https://github.com/Ar5en1c/webllm-bench
8k model: https://huggingface.co/Ar5en1c/Qwen2.5-1.5B-Instruct-q4f16_1-MLC-ctx8192
Result: 8k remains in ~2% parity band vs official 4k baseline on stress profile (1024/512/5).`

### Hacker News title

`Show HN: WebLLM Bench – benchmark/chat/compare local browser LLMs (+ hosted Qwen2.5-1.5B 8k preset)`

### Hacker News post text

`I open-sourced WebLLM Bench (browser-native local LLM benchmark/chat/compare toolkit) and a reproducible workflow package for a hosted Qwen2.5-1.5B ctx8192 build.

Live app:
https://ar5en1c.github.io/webllm-bench/bench.html

Repos:
https://github.com/Ar5en1c/webllm-bench
https://github.com/Ar5en1c/qwen2.5-1.5b-ctx8192-mlc

HF model:
https://huggingface.co/Ar5en1c/Qwen2.5-1.5B-Instruct-q4f16_1-MLC-ctx8192

Measured parity summary:
- Fixed profile (1024/128/10): median deltas in parity band vs official 4k baseline
- Stress profile (1024/512/5): throughput delta -1.96%, latency +1.94%

Functional check:
- 8k passes >4k retrieval prompts
- 4k overflows at 5813 prompt tokens

Limitations are explicitly documented (browser WebGPU VRAM telemetry is not exact).`

## 5) First 24h response loop

1. Reply to every issue/comment within 12 hours.
2. Ask reporters to include:
   - Browser/version
   - Model ID
   - Prompt/max tokens/iterations
   - Export JSON
3. For reproducibility disputes, point to:
   - `docs/VALIDATION_PROTOCOL_8K.md`
   - `reports/launch_8k_batch_validation_2026-03-28.md`
