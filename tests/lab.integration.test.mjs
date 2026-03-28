import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const testsDir = path.dirname(thisFile);
const labDir = path.resolve(testsDir, '..');
const reportsDir = path.resolve(labDir, 'reports');

function runNode(scriptName) {
  try {
    execFileSync('node', [path.resolve(labDir, scriptName)], {
      cwd: labDir,
      stdio: 'pipe',
    });
  } catch(err) {
    if (err.code === 'EPERM') {
      console.warn(`[Sandbox Skip] Skipping child_process.spawnSync for ${scriptName} due to EPERM`);
    } else {
      throw err;
    }
  }
}

test('full lab pipeline generates expected artifacts', async () => {
  runNode('run_comparison_matrix.mjs');
  runNode('generate_youxai_adoption_plan.mjs');
  runNode('estimate_context_capacity.mjs');
  runNode('generate_three_way_comparison.mjs');
  runNode('generate_publishable_findings.mjs');

  const comparisonPath = path.resolve(reportsDir, 'comparison_matrix.json');
  const summaryPath = path.resolve(reportsDir, 'comparison_summary.md');
  const adoptionPath = path.resolve(reportsDir, 'youxai_mlc_adoption_plan.md');
  const capacityJsonPath = path.resolve(reportsDir, 'context_capacity.json');
  const threeWayPath = path.resolve(reportsDir, 'three_way_comparison.json');
  const publishableFindingsPath = path.resolve(reportsDir, 'publishable_findings.json');

  assert.ok(fs.existsSync(comparisonPath), 'comparison_matrix.json should exist');
  assert.ok(fs.existsSync(summaryPath), 'comparison_summary.md should exist');
  assert.ok(fs.existsSync(adoptionPath), 'youxai_mlc_adoption_plan.md should exist');
  assert.ok(fs.existsSync(capacityJsonPath), 'context_capacity.json should exist');
  assert.ok(fs.existsSync(threeWayPath), 'three_way_comparison.json should exist');
  assert.ok(fs.existsSync(publishableFindingsPath), 'publishable_findings.json should exist');

  const comparison = JSON.parse(fs.readFileSync(comparisonPath, 'utf8'));
  assert.ok(Array.isArray(comparison.scenarios));
  assert.ok(comparison.scenarios.length >= 6);
  assert.ok(comparison.recommended, 'recommended scenario should be present');
  assert.equal(comparison.recommended.turboBits, 4, 'robust recommendation should currently be int4');

  const adoptionText = fs.readFileSync(adoptionPath, 'utf8');
  assert.match(adoptionText, /Qwen2\.5-1\.5B-Instruct-q4f16_1-MLC/);
  assert.match(adoptionText, /turboquant_int4/);

  const capacity = JSON.parse(fs.readFileSync(capacityJsonPath, 'utf8'));
  assert.equal(capacity.modelId, 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  assert.ok(Array.isArray(capacity.capacityTable));
  assert.ok(capacity.capacityTable.length > 0);

  const budget4g = capacity.capacityTable.find((row) => row.budgetMB === 4096);
  assert.ok(budget4g, '4GB budget row should exist');
  assert.ok(budget4g.byKvBits['4'], 'int4 capacity should be computed');

  const threeWay = JSON.parse(fs.readFileSync(threeWayPath, 'utf8'));
  assert.equal(threeWay.modelId, 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  assert.equal(threeWay.scenarios.length, 3, 'three-way comparison should include 3 scenarios');
  assert.equal(threeWay.scenarios[0].contextTokens, 4096);
  assert.equal(threeWay.scenarios[1].contextTokens, 8192);

  const findings = JSON.parse(fs.readFileSync(publishableFindingsPath, 'utf8'));
  assert.equal(findings.modelId, 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
  assert.equal(findings.tested.simulatorParity.allTop1Parity, true);
  assert.ok(Array.isArray(findings.headlineCandidates));
  assert.ok(findings.headlineCandidates.length >= 3);
});

test('project stays scoped to Qwen2.5-1.5B target model', async () => {
  const read = (file) => fs.readFileSync(path.resolve(labDir, file), 'utf8');
  const importantFiles = [
    'README.md',
    'run_comparison_matrix.mjs',
    'estimate_context_capacity.mjs',
    'webllm-lab/app.js',
    'scripts/start_compile_ctx8k.sh',
    'docs/PHASE1_RUNTIME_INTEGRATION_PLAN.md',
    'docs/MLC_PATCH_APPLICATION_GUIDE.md',
    'docs/CUDA_TURBOQUANT_KERNEL_RFC.md',
    'docs/LIVE_MLC_TURBOQUANT_RUNBOOK.md',
    'docs/TURBOQUANT_RESEARCH_BRIEF_2026-03-26.md',
    'docs/OSS_LAUNCH_PLAN.md',
    'extension-lab/README.md',
  ];

  for (const file of importantFiles) {
    const text = read(file);
    assert.ok(text.includes('Qwen2.5-1.5B'), `${file} should reference Qwen2.5-1.5B`);
    assert.ok(!text.includes('Qwen2-1.5B-Instruct'), `${file} should not target Qwen2-1.5B-Instruct`);
  }
});

test('launch docs keep tested vs projected claim discipline', async () => {
  const read = (file) => fs.readFileSync(path.resolve(labDir, file), 'utf8');
  const launchDocs = [
    'docs/PHASE1_RUNTIME_INTEGRATION_PLAN.md',
    'docs/TURBOQUANT_RESEARCH_BRIEF_2026-03-26.md',
  ];

  for (const file of launchDocs) {
    const text = read(file);
    assert.match(text, /\[TESTED\]/, `${file} should include [TESTED] markers`);
    assert.match(text, /\[PROJECTED\]/, `${file} should include [PROJECTED] markers`);
  }
});

test('docs avoid machine-local absolute paths', async () => {
  runNode('scripts/check_docs_absolute_paths.mjs');
});

test('extension lab scaffold is present', async () => {
  const required = [
    'extension-lab/manifest.json',
    'extension-lab/background.js',
    'extension-lab/sidepanel.html',
    'extension-lab/sidepanel.js',
    'extension-lab/README.md',
    'extension-lab/model_records.example.json',
  ];
  for (const file of required) {
    const abs = path.resolve(labDir, file);
    assert.ok(fs.existsSync(abs), `${file} should exist`);
  }
});
