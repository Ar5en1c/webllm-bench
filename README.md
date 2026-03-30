# WebLLM Bench
Browser-native local LLM toolkit for WebLLM/MLC models.

Maintainer:
- Kuldeep Singh ([Ar5en1c](https://github.com/Ar5en1c))
- Built alongside [YouxAI](https://youxai.app)

## Live Demo (GitHub Pages)

After enabling Pages in repository settings:

- https://ar5en1c.github.io/webllm-bench/

## Quick Start

```bash
python3 -m http.server 8765
# open http://localhost:8765/bench.html
```

First-run onboarding:
- [docs/START_HERE.md](docs/START_HERE.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [docs/HUGGINGFACE_ONE_CLICK_8K.md](docs/HUGGINGFACE_ONE_CLICK_8K.md)

## Core Features

- Benchmark (single + A/B compare)
- Chat with streaming output
- Side-by-side quality/speed compare
- Best-model sweep
- Community baseline import/export
- Custom model support (URL or local files)
- One-click hosted 8k preset for Qwen2.5-1.5B

## Launch Artifacts

- Release notes: [docs/RELEASE_NOTES_v1.0.0.md](docs/RELEASE_NOTES_v1.0.0.md)
- Launch thread copy: [docs/LAUNCH_THREAD_COPY_v1.0.0.md](docs/LAUNCH_THREAD_COPY_v1.0.0.md)
- Launch day checklist: [docs/LAUNCH_DAY_CHECKLIST_2026-03-30.md](docs/LAUNCH_DAY_CHECKLIST_2026-03-30.md)
- 8k validation protocol: [docs/VALIDATION_PROTOCOL_8K.md](docs/VALIDATION_PROTOCOL_8K.md)
- Batch validation report: [reports/launch_8k_batch_validation_2026-03-28.md](reports/launch_8k_batch_validation_2026-03-28.md)
- Device/model guide: [docs/DEVICE_MODEL_GUIDE_2026-03-30.md](docs/DEVICE_MODEL_GUIDE_2026-03-30.md)
- Pre-launch audit: [docs/PRELAUNCH_AUDIT_2026-03-30.md](docs/PRELAUNCH_AUDIT_2026-03-30.md)

## Repro

```bash
npm run test
npm run report:8k:batch
npm run launch:draft
```

## Publish Playbook

See [docs/PUBLISH_BOTH_OSS_PLAYBOOK.md](docs/PUBLISH_BOTH_OSS_PLAYBOOK.md).

## License

MIT
