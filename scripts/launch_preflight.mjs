#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const reportPath = path.resolve('reports', `launch_8k_batch_validation_${new Date().toISOString().slice(0, 10)}.md`);
const releasePath = path.resolve('docs', 'RELEASE_NOTES_v1.0.0.md');
const launchPath = path.resolve('docs', 'LAUNCH_THREAD_COPY_v1.0.0.md');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root, env: process.env });
}

function mustMatch(text, re, label) {
  const m = text.match(re);
  if (!m) throw new Error(`Missing ${label}`);
  return m[1].trim();
}

function readText(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function verifyConsistency() {
  const report = readText(reportPath);
  const release = readText(releasePath);
  const launch = readText(launchPath);

  const verdict = mustMatch(report, /Final verdict:\s*\*\*([^*]+)\*\*/m, 'final verdict');
  if (verdict.toUpperCase() !== 'PASS') {
    throw new Error(`Report verdict is not PASS: ${verdict}`);
  }

  const includedRuns = mustMatch(report, /Included 8k-vs-4k exports:\s*\*\*(\d+)\*\*/m, 'included runs');
  const decodeMedian = mustMatch(report, /Decode TPS delta \(8k vs 4k\):\s*\*\*([^*]+)\*\*/m, 'decode median');
  const throughputMedian = mustMatch(report, /Throughput delta:\s*\*\*([^*]+)\*\*/m, 'throughput median');
  const latencyMedian = mustMatch(report, /Latency delta:\s*\*\*([^*]+)\*\*/m, 'latency median');
  const parityMedian = mustMatch(report, /Token parity median:\s*\*\*([^*]+)\*\*/m, 'token parity median');
  const decodeRange = mustMatch(report, /Decode delta range:\s*([^\n]+)/m, 'decode range');
  const latencyRange = mustMatch(report, /Latency delta range:\s*([^\n]+)/m, 'latency range');

  const expectedInRelease = [
    `Included 8k-vs-4k runs: \`${includedRuns}\``,
    `- Decode TPS: \`${decodeMedian}\``,
    `- Throughput: \`${throughputMedian}\``,
    `- Latency: \`${latencyMedian}\``,
    `- Token parity: \`${parityMedian}\``,
    `- Decode delta: \`${decodeRange}\``,
    `- Latency delta: \`${latencyRange}\``,
  ];

  const expectedInLaunch = [
    `- Included exports: ${includedRuns} (8k custom vs 4k baseline pairs)`,
    `- Decode TPS: ${decodeMedian}`,
    `- Throughput: ${throughputMedian}`,
    `- Latency: ${latencyMedian}`,
    `- Token parity: ${parityMedian}`,
    `- Decode delta: ${decodeRange}`,
    `- Latency delta: ${latencyRange}`,
  ];

  for (const needle of expectedInRelease) {
    if (!release.includes(needle)) throw new Error(`Release notes mismatch: ${needle}`);
  }
  for (const needle of expectedInLaunch) {
    if (!launch.includes(needle)) throw new Error(`Launch copy mismatch: ${needle}`);
  }

  if (!launch.includes('Browser WebGPU does not expose exact live VRAM')) {
    throw new Error('Launch copy missing VRAM limitation disclosure.');
  }

  console.log('\nPreflight checks passed: report + release notes + launch copy are consistent.');
}

run('npm run test');
run(`node scripts/generate_8k_batch_report.mjs --out ${reportPath}`);
run(`node scripts/generate_launch_draft.mjs --report ${reportPath}`);
verifyConsistency();

console.log('\nLaunch preflight PASS. Ready to publish.');
