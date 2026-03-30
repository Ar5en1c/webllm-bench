# Start Here (3 Minutes)

Use this path if this is your first time with WebLLM Bench.

## 1) Open the app

- Live: https://ar5en1c.github.io/webllm-bench/
- Local: `python3 -m http.server 8765` then open `http://localhost:8765/bench.html`

## 2) Pick the right preset

In **Bench** tab, use **Preset**:
- `Desktop Chrome/Edge` (recommended default)
- `Safari Stable` (lower defaults, still reproducible)
- `Mobile Experimental` (small windows for stability)

## 3) Run your first reproducible benchmark

- Model: `Qwen2.5-1.5B-Instruct-q4f16_1-MLC`
- Profile: `1024/128/10`
- Enable: `Force full max tokens`
- Click: `Run Benchmark`

## 4) Export evidence

- Click `Export JSON`
- Keep browser version + screenshot + JSON together

## 5) Long-context check (8k workflow)

- Expand `Add Custom Model` and click `⚡ Add Qwen2.5 8k Preset (Hosted)`
- Compare custom 8k model vs 4k baseline using prompt >4096 tokens
- 8k should run; 4k should overflow

References:
- `docs/VALIDATION_PROTOCOL_8K.md`
- `docs/DEVICE_MODEL_GUIDE_2026-03-30.md`
- `docs/HUGGINGFACE_ONE_CLICK_8K.md`
