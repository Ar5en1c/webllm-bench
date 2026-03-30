# Publish Both OSS Repos (Execution Playbook)

This is the exact sequence to publish:
1) `webllm-bench`
2) `qwen2.5-1.5b-ctx8192-mlc`

## A. Run one-command preflight

From the project root:

```bash
npm run launch:all
```

This runs:
- tests
- latest 8k batch report generation
- release/thread draft generation
- consistency checks across report and launch copy

## B. Build clean publish packages

```bash
npm run oss:pack
```

Output folders:
- `dist/oss-packages/webllm-bench`
- `dist/oss-packages/qwen2.5-1.5b-ctx8192-mlc`

These are clean, curated publish directories.

Shortcut (recommended): once both empty GitHub repos exist, run:

```bash
./scripts/publish_two_repos_after_create.sh
```

If remote `main` already has unrelated history and you intentionally want to overwrite it:

```bash
ALLOW_FORCE_PUSH=1 ./scripts/publish_two_repos_after_create.sh
```

## C. Publish repo 1: webllm-bench

```bash
cd dist/oss-packages/webllm-bench
git init
git add .
git commit -m "release: webllm-bench v1.0.0"
git branch -M main
git remote add origin git@github.com:<ORG_OR_USER>/webllm-bench.git
git push -u origin main
```

Create GitHub release:
- Title/body from `docs/RELEASE_NOTES_v1.0.0.md`

## D. Publish repo 2: qwen2.5-1.5b-ctx8192-mlc

```bash
cd ../qwen2.5-1.5b-ctx8192-mlc
git init
git add .
git commit -m "release: qwen2.5-1.5b ctx8192 workflow v1.0.0"
git branch -M main
git remote add origin git@github.com:<ORG_OR_USER>/qwen2.5-1.5b-ctx8192-mlc.git
git push -u origin main
```

## E. Launch copy

Use:
- `docs/LAUNCH_THREAD_COPY_v1.0.0.md`

Post channels (same day):
- X thread
- LinkedIn post
- r/LocalLLaMA
- WebLLM/MLC Discord

## F. Monitor adoption (optional live counters)

- Configure telemetry endpoint per `docs/ANALYTICS_COUNTER_SETUP.md`
- Once enabled, header badges show:
  - Users (24h)
  - Runs (24h)

## H. First-user onboarding assets

Keep these visible in README and docs:
- `docs/START_HERE.md`
- `docs/TROUBLESHOOTING.md`
- `docs/DEVICE_MODEL_GUIDE_2026-03-30.md`

## G. Week-1 growth loop

Daily:
1. Triage issues within 24h
2. Merge low-risk fixes fast
3. Post one benchmark/comparison artifact
4. Update README “validated runs” section weekly
