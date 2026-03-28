# WebLLM Bench
Browser-native local LLM toolkit for WebLLM/MLC models.

## Live Demo (GitHub Pages)

After enabling Pages in repository settings:

- https://ar5en1c.github.io/webllm-bench/

## Quick Start

```bash
python3 -m http.server 8765
# open http://localhost:8765/bench.html
```

## Core Features

- Benchmark (single + A/B compare)
- Chat with streaming output
- Side-by-side quality/speed compare
- Best-model sweep
- Community baseline import/export
- Custom model support (URL or local files)

## Launch Artifacts

- Release notes: [docs/RELEASE_NOTES_v1.0.0.md](docs/RELEASE_NOTES_v1.0.0.md)
- Launch thread copy: [docs/LAUNCH_THREAD_COPY_v1.0.0.md](docs/LAUNCH_THREAD_COPY_v1.0.0.md)
- 8k validation protocol: [docs/VALIDATION_PROTOCOL_8K.md](docs/VALIDATION_PROTOCOL_8K.md)
- Batch validation report: [reports/launch_8k_batch_validation_2026-03-28.md](reports/launch_8k_batch_validation_2026-03-28.md)

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
