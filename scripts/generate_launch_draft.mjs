#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

function pickLatestReport(reportDir) {
  const files = fs
    .readdirSync(reportDir)
    .filter((f) => /^launch_8k_batch_validation_\d{4}-\d{2}-\d{2}\.md$/i.test(f))
    .map((f) => ({
      file: path.join(reportDir, f),
      mtimeMs: fs.statSync(path.join(reportDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  if (!files.length) {
    throw new Error('No launch_8k_batch_validation_*.md report found in reports/.');
  }
  return files[0].file;
}

function mustMatch(text, re, label) {
  const m = text.match(re);
  if (!m) throw new Error(`Could not parse ${label} from report.`);
  return m[1].trim();
}

function parseReport(reportPath) {
  const text = fs.readFileSync(reportPath, 'utf8');
  return {
    generatedAt: mustMatch(text, /^Generated:\s*(.+)$/m, 'generated timestamp'),
    includedRuns: mustMatch(text, /Included 8k-vs-4k exports:\s*\*\*(\d+)\*\*/m, 'included runs'),
    browsers: mustMatch(text, /Browser families detected in JSON:\s*(.+)$/m, 'browser families'),
    decodeMedian: mustMatch(text, /Decode TPS delta \(8k vs 4k\):\s*\*\*([^*]+)\*\*/m, 'decode median'),
    throughputMedian: mustMatch(text, /Throughput delta:\s*\*\*([^*]+)\*\*/m, 'throughput median'),
    latencyMedian: mustMatch(text, /Latency delta:\s*\*\*([^*]+)\*\*/m, 'latency median'),
    parityMedian: mustMatch(text, /Token parity median:\s*\*\*([^*]+)\*\*/m, 'token parity median'),
    decodeRange: mustMatch(text, /Decode delta range:\s*([^\n]+)/m, 'decode range'),
    latencyRange: mustMatch(text, /Latency delta range:\s*([^\n]+)/m, 'latency range'),
    verdict: mustMatch(text, /Final verdict:\s*\*\*([^*]+)\*\*/m, 'final verdict'),
  };
}

function buildReleaseNotes(version, reportRel, d) {
  return `# WebLLM Bench ${version}

## What this release includes

- Browser-native local LLM toolkit:
  - Benchmark
  - Chat
  - Side-by-side compare
  - Best-model sweep
  - Community baseline import/export
- Custom model support for MLC/WebLLM artifacts
- Reproducible 8k context validation protocol and report generators

## 8k validation result (Qwen2.5-1.5B, measured)

Source:
- \`${reportRel}\`

Profile used for all included parity runs:
- \`promptTokens=1024\`
- \`maxTokens=128\`
- \`iterations=10\`

Included 8k-vs-4k runs: \`${d.includedRuns}\`

Median deltas (8k custom vs 4k baseline):
- Decode TPS: \`${d.decodeMedian}\`
- Throughput: \`${d.throughputMedian}\`
- Latency: \`${d.latencyMedian}\`
- Token parity: \`${d.parityMedian}\`

Range:
- Decode delta: \`${d.decodeRange}\`
- Latency delta: \`${d.latencyRange}\`

Browser families represented in exports:
- \`${d.browsers}\`

Functional context gate:
- 8k model handles a >4k retrieval prompt.
- 4k baseline overflows at \`5813\` prompt tokens (\`context window size: 4096\`).

## Claim-safe summary

- [TESTED] Custom ctx8192 model is stable and remains in parity band vs the official 4k baseline on the fixed benchmark profile above.
- [TESTED] The ctx8192 model passes functional >4k prompt handling where 4k fails by context limit.
- [LIMITATION] Browser WebGPU does not expose exact live GPU VRAM usage counters; VRAM values are model metadata and JS heap proxies.

## Repro steps

\`\`\`bash
npm run test
npm run report:8k:batch
npm run launch:draft
\`\`\`

Per-export report:

\`\`\`bash
npm run report:8k:validation -- --in /absolute/path/to/webllm-bench-<timestamp>.json
\`\`\`

## Notes

- Excluded from 8k-vs-4k aggregate:
  - \`reports/webllm-bench-2026-03-28T205156281Z.json\` (not an 8k-vs-4k pair).
`;
}

function buildLaunchCopy(version, reportRel, d) {
  return `# Launch Copy ${version} (Claim-Safe)

Date: ${new Date().toISOString().slice(0, 10)}
Source metrics: \`${reportRel}\`

## 1) GitHub Release

### Title
\`WebLLM Bench ${version} + Qwen2.5-1.5B ctx8192 validation\`

### Body
\`\`\`
WebLLM Bench ${version} is now public.

What ships:
- Browser-native local LLM toolkit: benchmark, chat, side-by-side compare, best-model sweep, baseline import/export
- Custom model registry support for MLC/WebLLM artifacts
- Reproducible 8k context validation workflow for Qwen2.5-1.5B

8k validation summary (measured):
- Included exports: ${d.includedRuns} (8k custom vs 4k baseline pairs)
- Fixed profile: promptTokens=1024, maxTokens=128, iterations=10
- Browser families in exports: ${d.browsers}
- Median delta (8k vs 4k):
  - Decode TPS: ${d.decodeMedian}
  - Throughput: ${d.throughputMedian}
  - Latency: ${d.latencyMedian}
  - Token parity: ${d.parityMedian}
- Range:
  - Decode delta: ${d.decodeRange}
  - Latency delta: ${d.latencyRange}

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
- ${reportRel}
\`\`\`

## 2) X Thread (Exact Copy)

### Post 1
\`\`\`
Open-sourcing WebLLM Bench ${version}.

A browser-native local LLM toolkit for:
- benchmark
- chat
- side-by-side compare
- best-model sweep
- baseline import/export

Plus a reproducible ctx8192 validation workflow for Qwen2.5-1.5B.
\`\`\`

### Post 2
\`\`\`
8k validation on fixed profile (1024 prompt / 128 output / 10 iterations), using ${d.includedRuns} exported runs:

Median delta (8k custom vs 4k baseline):
- Decode TPS: ${d.decodeMedian}
- Throughput: ${d.throughputMedian}
- Latency: ${d.latencyMedian}
- Token parity: ${d.parityMedian}
\`\`\`

### Post 3
\`\`\`
Range across included runs:
- Decode delta: ${d.decodeRange}
- Latency delta: ${d.latencyRange}

Interpretation: parity band, no material regression on this profile.
\`\`\`

### Post 4
\`\`\`
Functional gate result:
- ctx8192 build handles >4k retrieval prompts
- ctx4096 baseline fails at 5813 prompt tokens with context overflow

So this is not only a config change; it is validated long-context behavior.
\`\`\`

### Post 5
\`\`\`
Limitation (explicit):
Browser WebGPU does not expose exact live VRAM usage counters.

Published VRAM numbers are model metadata / proxy signals, not hardware telemetry.
\`\`\`

### Post 6
\`\`\`
Everything is reproducible from repo artifacts:
- benchmark JSON exports
- validation protocol
- batch report generator

Commands:
npm run test
npm run report:8k:batch
npm run launch:draft
\`\`\`

## 3) LinkedIn Post (Exact Copy)

\`\`\`
We are open-sourcing WebLLM Bench ${version}.

This release includes a browser-native local LLM toolkit (benchmark, chat, side-by-side compare, best-model sweep, and baseline import/export) and a reproducible ctx8192 validation workflow for Qwen2.5-1.5B.

Measured 8k result on a fixed benchmark profile (1024 prompt tokens, 128 output tokens, 10 iterations), aggregated across ${d.includedRuns} exported runs:
- Decode TPS delta (8k vs 4k): ${d.decodeMedian}
- Throughput delta: ${d.throughputMedian}
- Latency delta: ${d.latencyMedian}
- Token parity: ${d.parityMedian}

Range across runs:
- Decode delta: ${d.decodeRange.replace(' .. ', ' to ')}
- Latency delta: ${d.latencyRange.replace(' .. ', ' to ')}

Functional context check also passed:
- ctx8192 build handled prompts beyond 4k context
- ctx4096 baseline overflowed at 5813 prompt tokens

One limitation to state clearly: browser WebGPU does not expose exact live VRAM counters, so VRAM values are metadata/proxy signals.

All claims are backed by exported JSON reports and a reproducible validation script in the repository.
\`\`\`
`;
}

const reportArg = parseArg('--report');
const version = parseArg('--version') || 'v1.0.0';
const reportPath = path.resolve(reportArg || pickLatestReport(path.resolve('reports')));
const reportRel = path.relative(process.cwd(), reportPath).replaceAll('\\\\', '/');

const releaseOut = path.resolve(parseArg('--out-release') || path.join('docs', 'RELEASE_NOTES_v1.0.0.md'));
const launchOut = path.resolve(parseArg('--out-launch') || path.join('docs', 'LAUNCH_THREAD_COPY_v1.0.0.md'));

const data = parseReport(reportPath);
if (data.verdict.toUpperCase() !== 'PASS') {
  throw new Error(`Refusing to draft launch copy from non-PASS report (${data.verdict}).`);
}

fs.mkdirSync(path.dirname(releaseOut), { recursive: true });
fs.mkdirSync(path.dirname(launchOut), { recursive: true });
fs.writeFileSync(releaseOut, buildReleaseNotes(version, reportRel, data), 'utf8');
fs.writeFileSync(launchOut, buildLaunchCopy(version, reportRel, data), 'utf8');

console.log(`Drafted release notes: ${releaseOut}`);
console.log(`Drafted launch copy: ${launchOut}`);
console.log(`Using report: ${reportPath}`);
