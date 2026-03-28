/**
 * WebLLM Bench v2.0 — full platform: benchmark, chat, compare, sweep, community.
 * Zero build step. Dynamic model registry from WebLLM. Streaming chat.
 */

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS & CONFIG
   ══════════════════════════════════════════════════════════════════════ */

const WEBLLM_URLS = [
  // Prefer bundle URLs first so source shims can be applied deterministically.
  'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.80/lib/index.min.js',
  'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.82/lib/index.min.js',
  // ESM fallbacks.
  'https://esm.run/@mlc-ai/web-llm@0.2.80',
  'https://esm.run/@mlc-ai/web-llm@0.2.82',
  'https://esm.run/@mlc-ai/web-llm@latest',
];
const DUP_SCOPE_THROW_NEEDLE = 'throw Error("Value attached to scope multiple times")';
const DUP_SCOPE_THROW_REPLACEMENT = 'console.warn("WebLLM Bench shim: suppressed duplicate scope attach warning")';
const SAMPLER_SNIPPET_NEEDLE =
  'const s=this.fargsortProbs(U),h=s.get(0),R=s.get(1),c=this.tvm.uniform([1],0,1,this.device),y=new Float32Array(1).fill(-1),L=Math.max(i,1e-5);this.sampleIndices.forEach((A=>{y[A]=L})),this.topPDevice.copyFrom(y);const J=this.tvm.detachFromCurrentScope(this.fsampleWithTopP(h,R,c,this.sampleIndicesDevice,this.topPDevice)),K=this.tvm.detachFromCurrentScope(this.tvm.empty([1],"int32",this.tvm.cpu()).copyFrom(J));';
const SAMPLER_SNIPPET_REPLACEMENT =
  'let J;if("function"!=typeof this.fargsortProbs||"function"!=typeof this.fsampleWithTopP){const __cpuProb=this.tvm.detachFromCurrentScope(this.tvm.empty([1,this.fullVocabSize],"float32",this.tvm.cpu()));__cpuProb.copyFrom(U);yield this.device.sync();const __arr=__cpuProb.toArray();let __idx=0,__best=__arr[0];for(let __i=1;__i<__arr.length;++__i)__arr[__i]>__best&&(__best=__arr[__i],__idx=__i);J=this.tvm.detachFromCurrentScope(this.tvm.empty([1],"int32",this.tvm.cpu()).copyFrom(new Int32Array([__idx])))}else{const s=this.fargsortProbs(U),h=s.get(0),R=s.get(1),c=this.tvm.uniform([1],0,1,this.device),y=new Float32Array(1).fill(-1),L=Math.max(i,1e-5);this.sampleIndices.forEach((A=>{y[A]=L})),this.topPDevice.copyFrom(y),J=this.tvm.detachFromCurrentScope(this.fsampleWithTopP(h,R,c,this.sampleIndicesDevice,this.topPDevice))}const K=this.tvm.detachFromCurrentScope(this.tvm.empty([1],"int32",this.tvm.cpu()).copyFrom(J));';
const SAMPLER_SNIPPET_REGEX =
  /const\s+\w+=this\.fargsortProbs\(U\),[\s\S]{0,1400}?this\.tvm\.empty\(\[1\],"int32",this\.tvm\.cpu\(\)\)\.copyFrom\(\w+\)\);/;

const USE_CASE_PROFILES = {
  chatbot: { name: 'Chat Assistant', weights: { ttft: 0.40, decodeTps: 0.30, prefillTps: 0.20, msPerTok: 0.10 }, reason: 'Prioritizes fast first response and snappy short replies.' },
  writer: { name: 'Content Generation', weights: { ttft: 0.10, decodeTps: 0.50, prefillTps: 0.10, msPerTok: 0.30 }, reason: 'Prioritizes sustained decode speed for long-form output.' },
  code: { name: 'Code Completion', weights: { ttft: 0.50, decodeTps: 0.30, prefillTps: 0.10, msPerTok: 0.10 }, reason: 'Prioritizes minimal latency — the user is waiting.' },
  documents: { name: 'Document Processing', weights: { ttft: 0.10, decodeTps: 0.10, prefillTps: 0.50, msPerTok: 0.30 }, reason: 'Prioritizes fast input processing and throughput efficiency.' },
};

/* ══════════════════════════════════════════════════════════════════════
   DOM REFS
   ══════════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

// Bench tab
const benchModelSelect = $('benchModelSelect');
const benchModelMeta = $('benchModelMeta');
const compareSelect = $('compareModel');
const promptTokensSel = $('promptTokens');
const maxTokensSel = $('maxTokens');
const iterationsSel = $('iterations');
const runBtn = $('runBtn');
const exportBtn = $('exportBtn');
const progressWrap = $('progressWrap');
const progressBar = $('progressBar');
const progressText = $('progressText');
const resultsCard = $('resultsCard');
const resultsContent = $('resultsContent');
const statusBanner = $('statusBanner');
const deviceInfoEl = $('deviceInfo');
const logArea = $('logArea');
const useIndexedDBCacheCheckbox = $('useIndexedDBCache');
const forceFullLengthCheckbox = $('forceFullLength');
const runtimeSourceEl = $('runtimeSource');
const cacheModeEl = $('cacheMode');
const modelRootEl = $('modelRoot');
const modelLibEl = $('modelLib');
const modelUrlsEl = $('modelUrls');

// Chat tab
const chatModelSelect = $('chatModelSelect');
const chatModelMeta = $('chatModelMeta');
const chatSystemPrompt = $('chatSystemPrompt');
const chatTemp = $('chatTemp');
const chatMaxTokens = $('chatMaxTokens');
const chatTopP = $('chatTopP');
const chatHistoryTurns = $('chatHistoryTurns');
const chatWindowMode = $('chatWindowMode');
const chatSlidingWindow = $('chatSlidingWindow');
const chatUseHistory = $('chatUseHistory');
const chatGroundFacts = $('chatGroundFacts');
const chatLoadBtn = $('chatLoadBtn');
const chatProgressWrap = $('chatProgressWrap');
const chatProgressBar = $('chatProgressBar');
const chatProgressText = $('chatProgressText');
const chatMessages = $('chatMessages');
const chatInput = $('chatInput');
const chatSendBtn = $('chatSendBtn');
const chatClearBtn = $('chatClearBtn');

// Compare tab
const compareModelA = $('compareModelA');
const compareModelB = $('compareModelB');
const compareMetaA = $('compareMetaA');
const compareMetaB = $('compareMetaB');
const comparePrompt = $('comparePrompt');
const compareMaxTokens = $('compareMaxTokens');
const compareTemp = $('compareTemp');
const compareSlidingWindow = $('compareSlidingWindow');
const compareRunBtn = $('compareRunBtn');
const compareProgressWrap = $('compareProgressWrap');
const compareProgressBar = $('compareProgressBar');
const compareProgressText = $('compareProgressText');
const compareResultsCard = $('compareResultsCard');
const compareHeaderA = $('compareHeaderA');
const compareHeaderB = $('compareHeaderB');
const compareResponseA = $('compareResponseA');
const compareResponseB = $('compareResponseB');
const compareMetricsA = $('compareMetricsA');
const compareMetricsB = $('compareMetricsB');

// Find Best tab
const sweepBtn = $('sweepBtn');
const sweepModelFilter = $('sweepModelFilter');
const sweepProgressWrap = $('sweepProgressWrap');
const sweepProgressBar = $('sweepProgressBar');
const sweepProgressText = $('sweepProgressText');
const recCard = $('recCard');
const recModelEl = $('recModel');
const recReasonEl = $('recReason');
const recScoresEl = $('recScores');
const rankCard = $('rankCard');
const rankContent = $('rankContent');

// Community tab
const shareBtn = $('shareBtn');
const importBtn = $('importBtn');
const exportSweepBtn = $('exportSweepBtn');
const importCard = $('importCard');
const importArea = $('importArea');
const importConfirmBtn = $('importConfirmBtn');
const shareCard = $('shareCard');
const sharePreview = $('sharePreview');
const baselineCountEl = $('baselineCount');
const leaderboardCard = $('leaderboardCard');
const leaderboardContent = $('leaderboardContent');
const globalFamilyFilter = $('globalFamilyFilter');
const liveUsersBadge = $('liveUsersBadge');
const liveRunsBadge = $('liveRunsBadge');

// Custom Models
const customModelUrl = $('customModelUrl');
const customLibUrl = $('customLibUrl');
const customModelId = $('customModelId');
const customContext = $('customContext');
const customVram = $('customVram');
const addBaseline8kPresetBtn = $('addBaseline8kPresetBtn');
const addCustomBtn = $('addCustomBtn');
const clearCustomBtn = $('clearCustomBtn');
const customModelWarn = $('customModelWarn');
const localModelFilesDropzone = $('localModelFilesDropzone');
const localModelFilesInfo = $('localModelFilesInfo');
const localModelFilesInput = $('localModelFilesInput');
const localModelFolderInput = $('localModelFolderInput');
const pickLocalModelFilesBtn = $('pickLocalModelFilesBtn');
const pickLocalModelFolderBtn = $('pickLocalModelFolderBtn');
const clearLocalModelFilesBtn = $('clearLocalModelFilesBtn');
const localWasmDropzone = $('localWasmDropzone');
const localWasmInfo = $('localWasmInfo');
const localWasmFileInput = $('localWasmFileInput');
const pickLocalWasmBtn = $('pickLocalWasmBtn');
const clearLocalWasmBtn = $('clearLocalWasmBtn');

/* ══════════════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════════════ */

let webllm = null;
let engine = null;
let activeModelId = null;
let lastReport = null;
let lastSweepReport = null;
let deviceInfo = null;
let webllmSourceUrl = '';
let allModels = [];      // ModelRecord[] from WebLLM
let prebuiltModels = []; // immutable snapshot of runtime registry list
let modelMeta = {};      // { modelId: { family, size, quant, vram, ctx, lowRes } }
let captureModelFetchUrls = false;
let observedModelFetchUrls = [];
let fetchTracerInstalled = false;
let ignoreEosSupport = 'unknown';
let selectedUseCase = 'chatbot';
let communityBaselines = [];
let customModels = []; // ModelRecord[] from localStorage
let selectedLocalModelFiles = [];
let selectedLocalWasmFile = null;
const localModelStores = new Map(); // virtualRoot -> { files: Map<name, File>, modelId }
const patchedRuntimeScopeTargets = new WeakSet();
let chatHistory = [];
let chatModelLoaded = false;
let analyticsRefreshTimer = null;

const ANALYTICS_CONFIG = {
  endpoint: '',
  siteId: 'webllm-bench',
  apiKey: '',
  enabled: false,
};
const ANALYTICS_SESSION_ID = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const ANALYTICS_INSTALLATION_KEY = 'webllm_bench_installation_id';

/* ══════════════════════════════════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════════════════════════════════ */

/** Detect models that emit <think> reasoning tokens (Qwen3, DeepSeek-R1, etc.) */
function isThinkingModel(modelId) {
  return /Qwen3|DeepSeek-R1|QwQ/i.test(modelId || '');
}

/** Strip <think>…</think> blocks and return { thinking, answer } */
function parseThinkingOutput(text) {
  const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  if (!thinkMatch) return { thinking: '', answer: text.trim(), hasThinking: false };
  const thinking = thinkMatch[1].trim();
  const afterTag = text.indexOf('</think>');
  const answer = afterTag >= 0 ? text.slice(afterTag + 8).trim() : '';
  return { thinking, answer, hasThinking: true };
}

function buildGroundedChatPreamble(modelId) {
  const now = new Date();
  const localDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return [
    'You are running inside WebLLM Bench as a local on-device model.',
    `Loaded model ID: ${modelId || 'unknown'}.`,
    `Local date for this session: ${localDate}.`,
    'If asked who/what model you are, answer using the loaded model ID above.',
    'Do not claim to be Anthropic, OpenAI, or any provider that is not implied by the loaded model ID.',
    'If asked today\'s date, use the local date provided above.',
  ].join('\n');
}

function detectLocalFactIntent(text) {
  const q = String(text || '').toLowerCase();
  const asksDate =
    /\b(today'?s date|current date|date today|what(?:'s| is) (?:today'?s |the )?date|what day is it)\b/.test(q);
  const asksModel =
    /\b(what model|which model|model are you|who are you|are you qwen|are you .*model|what are you)\b/.test(q);
  const asksCutoff =
    /\b(knowledge cutoff|cut[- ]?off|training cutoff|last update|when were you trained|up to what date)\b/.test(q);
  return { asksDate, asksModel, asksCutoff };
}

function buildLocalFactReply(intent, modelId) {
  const id = modelId || 'unknown-model';
  const meta = modelMeta[id] || {};
  const name = meta.shortName || id;
  const now = new Date();
  const prettyDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const isoDateLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const parts = [];
  if (intent.asksModel) {
    parts.push(`You are chatting with local model "${name}" (model_id: ${id}).`);
  }
  if (intent.asksDate) {
    parts.push(`Today's local date is ${prettyDate} (${isoDateLocal}).`);
  }
  if (intent.asksCutoff) {
    parts.push('Knowledge cutoff is not reliably exposed by this local WebLLM runtime. Check the model card/release notes for this exact model_id.');
  }
  return parts.join(' ');
}

function clampInt(v, fallback, min, max) {
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function getPromptHistoryWindow(history) {
  const useHistory = chatUseHistory?.checked !== false;
  if (!useHistory) return history.length ? [history[history.length - 1]] : [];
  const turns = clampInt(chatHistoryTurns?.value, 14, 1, 50);
  const maxMessages = Math.max(2, turns * 2);
  return history.slice(-maxMessages);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function getRuntimeMemorySnapshot() {
  const snap = {
    timestamp: new Date().toISOString(),
    jsHeapUsedMB: null,
    jsHeapTotalMB: null,
    jsHeapLimitMB: null,
    deviceMemoryGB: Number.isFinite(navigator?.deviceMemory) ? navigator.deviceMemory : null,
    note: 'GPU VRAM usage is not directly exposed by WebGPU in browser runtimes.',
  };
  const mem = performance?.memory;
  if (mem && Number.isFinite(mem.usedJSHeapSize)) {
    snap.jsHeapUsedMB = +(mem.usedJSHeapSize / (1024 * 1024)).toFixed(2);
    snap.jsHeapTotalMB = +(mem.totalJSHeapSize / (1024 * 1024)).toFixed(2);
    snap.jsHeapLimitMB = +(mem.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
  }
  return snap;
}

function getAnalyticsInstallationId() {
  try {
    const existing = localStorage.getItem(ANALYTICS_INSTALLATION_KEY);
    if (existing) return existing;
    const id = `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANALYTICS_INSTALLATION_KEY, id);
    return id;
  } catch {
    return `inst_ephemeral_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function resolveAnalyticsConfig() {
  let cfg = {};
  if (typeof window !== 'undefined' && window.WEBLLM_BENCH_ANALYTICS && typeof window.WEBLLM_BENCH_ANALYTICS === 'object') {
    cfg = { ...window.WEBLLM_BENCH_ANALYTICS };
  }
  try {
    const raw = localStorage.getItem('webllm_bench_analytics_config');
    if (raw) cfg = { ...cfg, ...JSON.parse(raw) };
  } catch { /* ignore */ }

  const endpoint = String(cfg.endpoint || '').trim();
  const siteId = String(cfg.siteId || ANALYTICS_CONFIG.siteId).trim() || 'webllm-bench';
  const apiKey = String(cfg.apiKey || '').trim();
  ANALYTICS_CONFIG.endpoint = endpoint;
  ANALYTICS_CONFIG.siteId = siteId;
  ANALYTICS_CONFIG.apiKey = apiKey;
  ANALYTICS_CONFIG.enabled = endpoint.startsWith('http://') || endpoint.startsWith('https://');
}

function analyticsHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (ANALYTICS_CONFIG.apiKey) h['x-api-key'] = ANALYTICS_CONFIG.apiKey;
  return h;
}

function setAnalyticsBadges(users24h, runs24h) {
  if (!liveUsersBadge || !liveRunsBadge) return;
  if (!ANALYTICS_CONFIG.enabled) {
    liveUsersBadge.classList.add('hidden');
    liveRunsBadge.classList.add('hidden');
    return;
  }
  liveUsersBadge.textContent = `Users (24h): ${Number.isFinite(users24h) ? users24h : '—'}`;
  liveRunsBadge.textContent = `Runs (24h): ${Number.isFinite(runs24h) ? runs24h : '—'}`;
  liveUsersBadge.classList.remove('hidden');
  liveRunsBadge.classList.remove('hidden');
}

async function refreshLiveCounters() {
  if (!ANALYTICS_CONFIG.enabled) return;
  try {
    const q = new URLSearchParams({ site_id: ANALYTICS_CONFIG.siteId });
    const res = await fetch(`${ANALYTICS_CONFIG.endpoint.replace(/\/+$/, '')}/stats?${q.toString()}`, {
      method: 'GET',
      headers: ANALYTICS_CONFIG.apiKey ? { 'x-api-key': ANALYTICS_CONFIG.apiKey } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`stats ${res.status}`);
    const payload = await res.json();
    const users24h = Number(payload?.unique_users_24h ?? payload?.visits_24h ?? NaN);
    const runs24h = Number(payload?.benchmark_runs_24h ?? payload?.runs_24h ?? NaN);
    setAnalyticsBadges(users24h, runs24h);
  } catch (err) {
    log(`Analytics stats unavailable: ${err.message}`);
    setAnalyticsBadges(NaN, NaN);
  }
}

async function trackUsageEvent(eventName, extra = {}) {
  if (!ANALYTICS_CONFIG.enabled) return;
  const payload = {
    site_id: ANALYTICS_CONFIG.siteId,
    event_name: eventName,
    ts: new Date().toISOString(),
    session_id: ANALYTICS_SESSION_ID,
    installation_id: getAnalyticsInstallationId(),
    page: typeof location !== 'undefined' ? location.pathname : '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...extra,
  };

  try {
    if (navigator?.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const accepted = navigator.sendBeacon(`${ANALYTICS_CONFIG.endpoint.replace(/\/+$/, '')}/event`, blob);
      if (!accepted) throw new Error('sendBeacon rejected');
    } else {
      const res = await fetch(`${ANALYTICS_CONFIG.endpoint.replace(/\/+$/, '')}/event`, {
        method: 'POST',
        headers: analyticsHeaders(),
        body: JSON.stringify(payload),
        keepalive: true,
      });
      if (!res.ok) throw new Error(`event ${res.status}`);
    }
  } catch (err) {
    log(`Analytics event dropped (${eventName}): ${err.message}`);
  }
}

function startAnalytics() {
  resolveAnalyticsConfig();
  if (!ANALYTICS_CONFIG.enabled) {
    setAnalyticsBadges(NaN, NaN);
    return;
  }

  trackUsageEvent('visit').catch(() => {});
  refreshLiveCounters().catch(() => {});

  if (analyticsRefreshTimer) clearInterval(analyticsRefreshTimer);
  analyticsRefreshTimer = setInterval(() => {
    refreshLiveCounters().catch(() => {});
  }, 60000);
}

function isWasmFile(file) {
  if (!file) return false;
  const n = String(file.name || '').toLowerCase();
  return n.endsWith('.wasm') || file.type === 'application/wasm';
}

function clearLocalWasmSelection() {
  selectedLocalWasmFile = null;
  if (localWasmFileInput) localWasmFileInput.value = '';
  if (localWasmInfo) localWasmInfo.textContent = 'No local .wasm selected.';
  if (localWasmDropzone) localWasmDropzone.classList.remove('dragover');
}

function setLocalWasmSelection(file) {
  if (!file) return;
  if (!isWasmFile(file)) {
    if (customModelWarn) {
      customModelWarn.style.color = 'var(--yellow)';
      customModelWarn.textContent = 'Invalid file. Please pick a .wasm model lib.';
    }
    return;
  }
  selectedLocalWasmFile = file;
  if (localWasmInfo) localWasmInfo.textContent = `${file.name} (${formatBytes(file.size)}) selected for model lib.`;
  if (customModelWarn) {
    customModelWarn.style.color = 'var(--text-muted)';
    customModelWarn.textContent = 'Local wasm selected. Add model to register it for this browser session.';
  }
}

function setupLocalWasmDropzone() {
  if (!localWasmDropzone) return;

  const prevent = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
  ['dragenter', 'dragover'].forEach(evt => {
    localWasmDropzone.addEventListener(evt, (ev) => {
      prevent(ev);
      localWasmDropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    localWasmDropzone.addEventListener(evt, (ev) => {
      prevent(ev);
      localWasmDropzone.classList.remove('dragover');
    });
  });
  localWasmDropzone.addEventListener('drop', (ev) => {
    const files = Array.from(ev.dataTransfer?.files || []);
    if (!files.length) return;
    const wasm = files.find(isWasmFile) || files[0];
    setLocalWasmSelection(wasm);
  });

  if (pickLocalWasmBtn && localWasmFileInput) {
    pickLocalWasmBtn.addEventListener('click', () => localWasmFileInput.click());
    localWasmFileInput.addEventListener('change', () => {
      const file = localWasmFileInput.files?.[0];
      if (file) setLocalWasmSelection(file);
    });
  }

  if (clearLocalWasmBtn) clearLocalWasmBtn.addEventListener('click', clearLocalWasmSelection);
}

function normalizeLocalFilePath(file) {
  const rel = String(file?.webkitRelativePath || file?.name || '').replace(/\\/g, '/').replace(/^\/+/, '');
  return rel;
}

function extractLocalModelFileMap(files) {
  const byPath = new Map();
  for (const f of files) {
    const rel = normalizeLocalFilePath(f);
    if (!rel) continue;
    byPath.set(rel, f);
    const base = rel.split('/').pop();
    if (base && !byPath.has(base)) byPath.set(base, f);
  }
  return byPath;
}

function validateLocalModelFiles(files) {
  const map = extractLocalModelFileMap(files);
  const required = ['mlc-chat-config.json', 'tensor-cache.json', 'tokenizer.json'];
  const missing = required.filter(n => !map.has(n));
  const hasParams = Array.from(map.keys()).some(k => /^params_shard_\d+\.bin$/i.test(k));
  if (!hasParams) missing.push('params_shard_*.bin');
  return { missing, map };
}

function clearLocalModelFilesSelection() {
  selectedLocalModelFiles = [];
  if (localModelFilesInput) localModelFilesInput.value = '';
  if (localModelFolderInput) localModelFolderInput.value = '';
  if (localModelFilesDropzone) localModelFilesDropzone.classList.remove('dragover');
  if (localModelFilesInfo) localModelFilesInfo.textContent = 'No local model files selected.';
}

function setLocalModelFilesSelection(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  selectedLocalModelFiles = list;
  const { missing } = validateLocalModelFiles(list);
  const hasWasm = list.some(isWasmFile);
  const missingMsg = missing.length ? ` Missing: ${missing.join(', ')}.` : '';
  const wasmMsg = hasWasm ? ' Includes local .wasm.' : ' No .wasm detected in selection.';
  if (localModelFilesInfo) localModelFilesInfo.textContent = `${list.length} files selected.${wasmMsg}${missingMsg}`;
  if (customModelWarn) {
    customModelWarn.style.color = missing.length ? 'var(--yellow)' : 'var(--text-muted)';
    customModelWarn.textContent = missing.length
      ? `Local files selected but incomplete: ${missing.join(', ')}.`
      : 'Local model files selected. Add model to register for this session.';
  }
}

function setupLocalModelFilesDropzone() {
  if (!localModelFilesDropzone) return;
  const prevent = (ev) => { ev.preventDefault(); ev.stopPropagation(); };

  ['dragenter', 'dragover'].forEach(evt => {
    localModelFilesDropzone.addEventListener(evt, (ev) => {
      prevent(ev);
      localModelFilesDropzone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(evt => {
    localModelFilesDropzone.addEventListener(evt, (ev) => {
      prevent(ev);
      localModelFilesDropzone.classList.remove('dragover');
    });
  });
  localModelFilesDropzone.addEventListener('drop', (ev) => {
    const files = ev.dataTransfer?.files ? Array.from(ev.dataTransfer.files) : [];
    if (files.length) setLocalModelFilesSelection(files);
  });

  if (pickLocalModelFilesBtn && localModelFilesInput) {
    pickLocalModelFilesBtn.addEventListener('click', () => localModelFilesInput.click());
    localModelFilesInput.addEventListener('change', () => {
      const files = localModelFilesInput.files ? Array.from(localModelFilesInput.files) : [];
      if (files.length) setLocalModelFilesSelection(files);
    });
  }

  if (pickLocalModelFolderBtn && localModelFolderInput) {
    pickLocalModelFolderBtn.addEventListener('click', () => localModelFolderInput.click());
    localModelFolderInput.addEventListener('change', () => {
      const files = localModelFolderInput.files ? Array.from(localModelFolderInput.files) : [];
      if (files.length) setLocalModelFilesSelection(files);
    });
  }

  if (clearLocalModelFilesBtn) clearLocalModelFilesBtn.addEventListener('click', clearLocalModelFilesSelection);
}

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  logArea.textContent += `[${ts}] ${msg}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

function showStatus(type, msg) {
  statusBanner.className = `status-banner ${type}`;
  statusBanner.classList.remove('hidden');
  statusBanner.textContent = msg;
}

function clearStatus() {
  statusBanner.className = 'status-banner hidden';
  statusBanner.textContent = '';
}

function setElProgress(wrap, bar, text, pct, label) {
  wrap.classList.add('active');
  bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  text.textContent = label || '';
}

function hideElProgress(wrap) { wrap.classList.remove('active'); }

function getCacheLabel() {
  return useIndexedDBCacheCheckbox?.checked ? 'IndexedDB' : 'network';
}

function uniqUrls(urls) {
  return Array.from(new Set(urls.filter(v => typeof v === 'string' && v.startsWith('http'))));
}

function dedupeModelRecords(records) {
  const out = [];
  const seen = new Set();
  for (const rec of records || []) {
    const id = rec?.model_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(rec);
  }
  return out;
}

function rebuildModelRegistry() {
  const merged = [...customModels, ...prebuiltModels];
  allModels = dedupeModelRecords(merged).filter(m => m?.model_id && m?.model_lib);
  modelMeta = {};
  for (const m of allModels) modelMeta[m.model_id] = parseModelMeta(m);
}

function getObjectGraphChildren(value) {
  const children = [];
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return children;
  for (const key of Reflect.ownKeys(value)) {
    let desc;
    try {
      desc = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      continue;
    }
    if (!desc || !('value' in desc)) continue;
    const child = desc.value;
    if (!child || (typeof child !== 'object' && typeof child !== 'function')) continue;
    children.push(child);
  }
  const proto = Object.getPrototypeOf(value);
  if (proto && proto !== Object.prototype && proto !== Function.prototype) children.push(proto);
  return children;
}

function patchRuntimeScopeManager(target, sourceLabel) {
  if (!target || (typeof target !== 'object' && typeof target !== 'function')) return false;
  if (patchedRuntimeScopeTargets.has(target)) return false;
  if (typeof target.attachToCurrentScope !== 'function' || typeof target.detachFromCurrentScope !== 'function') return false;

  const originalAttach = target.attachToCurrentScope;
  const originalDetach = target.detachFromCurrentScope;

  target.attachToCurrentScope = function patchedAttachToCurrentScope(obj) {
    const scopeStack = this?.autoDisposeScope;
    if (Array.isArray(scopeStack) && scopeStack.length > 0) {
      const currentScope = scopeStack[scopeStack.length - 1];
      if (Array.isArray(currentScope) && currentScope.includes(obj)) {
        log(`Runtime scope patch: skipped duplicate attach from ${sourceLabel}.`);
        return obj;
      }
    }
    return originalAttach.call(this, obj);
  };

  target.detachFromCurrentScope = function patchedDetachFromCurrentScope(obj) {
    const scopeStack = this?.autoDisposeScope;
    if (Array.isArray(scopeStack) && scopeStack.length > 0) {
      const currentScope = scopeStack[scopeStack.length - 1];
      if (Array.isArray(currentScope)) {
        let seen = 0;
        for (let i = 0; i < currentScope.length; i += 1) {
          if (currentScope[i] === obj) {
            seen += 1;
            if (seen > 1) currentScope[i] = undefined;
          }
        }
      }
    }
    try {
      return originalDetach.call(this, obj);
    } catch (err) {
      if ((err?.message || '').includes('Value attached to scope multiple times')) {
        log(`Runtime scope patch: suppressed duplicate detach failure from ${sourceLabel}.`);
        return obj;
      }
      throw err;
    }
  };

  patchedRuntimeScopeTargets.add(target);
  return true;
}

function inspectAndPatchRuntimeGraph(root, rootLabel, maxDepth = 10) {
  const seen = new WeakSet();
  const queue = [{ value: root, depth: 0, label: rootLabel }];
  let scopePatchCount = 0;
  while (queue.length > 0) {
    const { value, depth, label } = queue.shift();
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) continue;
    if (seen.has(value) || depth > maxDepth) continue;
    seen.add(value);
    if (patchRuntimeScopeManager(value, label)) scopePatchCount += 1;
    let idx = 0;
    for (const child of getObjectGraphChildren(value)) {
      queue.push({ value: child, depth: depth + 1, label: `${label}[${idx}]` });
      idx += 1;
    }
  }
  return { scopePatchCount };
}

function patchRuntimeScopeInModule(runtimeModule) {
  const { scopePatchCount } = inspectAndPatchRuntimeGraph(runtimeModule, 'runtime-module', 12);
  if (scopePatchCount > 0) log(`Runtime scope patch: prepatched ${scopePatchCount} scope manager target(s).`);
}

function guessMimeType(name = '') {
  const n = String(name).toLowerCase();
  if (n.endsWith('.json')) return 'application/json';
  if (n.endsWith('.wasm')) return 'application/wasm';
  if (n.endsWith('.bin')) return 'application/octet-stream';
  if (n.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

async function maybeServeLocalModelAsset(url) {
  if (!url || localModelStores.size === 0) return null;
  for (const [root, store] of localModelStores.entries()) {
    if (!url.startsWith(root)) continue;
    const rel = url.slice(root.length).replace(/^\/+/, '');
    const candidates = [];
    if (rel) candidates.push(rel);
    if (rel.startsWith('resolve/main/')) candidates.push(rel.slice('resolve/main/'.length));
    if (rel.includes('/')) candidates.push(rel.split('/').pop());
    if (!rel) candidates.push('mlc-chat-config.json');
    const tried = new Set();
    for (const c of candidates) {
      if (!c || tried.has(c)) continue;
      tried.add(c);
      const f = store.files.get(c);
      if (!f) continue;
      const ab = await f.arrayBuffer();
      return new Response(ab, { status: 200, headers: { 'Content-Type': guessMimeType(f.name), 'Cache-Control': 'no-store' } });
    }
    return new Response(`Local model asset not found: ${rel}`, { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }
  return null;
}

function isBundleRuntimeUrl(url) {
  return /\/lib\/index\.min\.js(?:\?|$)/.test(String(url || ''));
}

async function loadWebLLMRuntime(url) {
  if (isBundleRuntimeUrl(url)) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching runtime bundle`);
    let source = await res.text();
    if (source.includes(DUP_SCOPE_THROW_NEEDLE)) {
      source = source.split(DUP_SCOPE_THROW_NEEDLE).join(DUP_SCOPE_THROW_REPLACEMENT);
      log('Applied WebLLM source shim: suppressed duplicate-scope throw.');
    } else {
      log('WebLLM source shim: duplicate-scope throw site not found in bundle.');
    }
    if (source.includes(SAMPLER_SNIPPET_NEEDLE)) {
      source = source.split(SAMPLER_SNIPPET_NEEDLE).join(SAMPLER_SNIPPET_REPLACEMENT);
      log('Applied WebLLM source shim: added argmax sampler fallback (exact patch).');
    } else if (SAMPLER_SNIPPET_REGEX.test(source)) {
      source = source.replace(SAMPLER_SNIPPET_REGEX, SAMPLER_SNIPPET_REPLACEMENT);
      log('Applied WebLLM source shim: added argmax sampler fallback (regex patch).');
    } else {
      log('WebLLM source shim: sampler fallback patch site not found in bundle.');
    }
    const blobUrl = URL.createObjectURL(new Blob([`${source}\n//# sourceURL=${url}\n`], { type: 'text/javascript' }));
    try {
      return await import(blobUrl);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }
  return import(url);
}

function installFetchTracer() {
  if (fetchTracerInstalled || typeof window.fetch !== 'function') return;
  const orig = window.fetch.bind(window);
  window.fetch = async (...a) => {
    let u = '';
    try { u = typeof a[0] === 'string' ? a[0] : a[0]?.url || ''; } catch { u = ''; }
    const localResp = await maybeServeLocalModelAsset(u);
    if (captureModelFetchUrls && u) observedModelFetchUrls.push(u);
    if (localResp) return localResp;
    return orig(...a);
  };
  fetchTracerInstalled = true;
}

function updateSourcePanel(opts = {}) {
  if (runtimeSourceEl) runtimeSourceEl.textContent = opts.runtimeSource || webllmSourceUrl || '—';
  if (cacheModeEl) cacheModeEl.textContent = opts.cacheMode || getCacheLabel();
  if (modelRootEl) modelRootEl.textContent = opts.modelRoot || '—';
  if (modelLibEl) modelLibEl.textContent = opts.modelLib || '—';
  if (modelUrlsEl) {
    const u = opts.urls || [];
    modelUrlsEl.textContent = u.length > 0 ? u.join('\n') : '(cache hit or not captured)';
  }
}

/* ══════════════════════════════════════════════════════════════════════
   MODEL METADATA PARSER
   ══════════════════════════════════════════════════════════════════════ */

function parseModelMeta(record) {
  const id = record.model_id || '';
  // Family detection
  const familyPatterns = [
    [/^Llama/i, 'Llama'], [/^Qwen/i, 'Qwen'], [/^Phi/i, 'Phi'],
    [/^Gemma/i, 'Gemma'], [/^Smol/i, 'SmolLM'], [/^Deep\s?Seek/i, 'DeepSeek'],
    [/^Mistral/i, 'Mistral'], [/^Hermes/i, 'Hermes'], [/^gemma/i, 'Gemma'],
    [/^Intern/i, 'InternLM'], [/^TinyLlama/i, 'TinyLlama'],
  ];
  let family = 'Other';
  for (const [pat, name] of familyPatterns) { if (pat.test(id)) { family = name; break; } }

  // Size extraction
  const sizeMatch = id.match(/(\d+\.?\d*)[Bb]-/);
  const size = sizeMatch ? sizeMatch[1] + 'B' : '?';

  // Quantization
  const quantMatch = id.match(/(q[04]f\d+(?:_\d+)?)/i);
  const quant = quantMatch ? quantMatch[1] : '?';

  const vram = record.vram_required_MB || 0;
  const ctx = record.overrides?.context_window_size || 0;
  const lowRes = record.low_resource_required || false;
  const features = record.required_features || [];
  const isVLM = record.model_type === 2; // ModelType.VLM
  const isCustom = record.is_custom || false;

  // Short display name
  let shortName = id.replace(/-MLC$/, '').replace(/-q\w+/, '');
  if (shortName.length > 30) shortName = shortName.slice(0, 28) + '…';

  return { id, family, size, quant, vram, ctx, lowRes, features, isVLM, shortName, isCustom };
}

function modelMetaText(meta) {
  const parts = [];
  if (meta.isCustom) parts.push('<span style="color:var(--accent);">🔧 Custom</span>');
  if (meta.vram) parts.push(`<span class="vram">VRAM: ${meta.vram.toFixed(0)} MB</span>`);
  if (meta.ctx) parts.push(`<span class="ctx">ctx: ${meta.ctx}</span>`);
  if (meta.lowRes) parts.push('📱 low-resource');
  if (meta.isVLM) parts.push('🖼️ vision');
  if (meta.features.includes('shader-f16')) parts.push('⚡ f16');
  return parts.join(' · ');
}

/* ══════════════════════════════════════════════════════════════════════
   DYNAMIC MODEL REGISTRY
   ══════════════════════════════════════════════════════════════════════ */

function populateModelSelectors() {
  if (allModels.length === 0) return;

  const currentFilter = globalFamilyFilter?.value || 'All';

  // Group by family
  const groups = {};
  for (const m of allModels) {
    const meta = modelMeta[m.model_id];
    let fam = meta?.family || 'Other';
    if (meta?.isCustom) fam = 'Custom';
    
    // Apply family filter
    if (currentFilter !== 'All' && fam !== currentFilter) continue;
    
    if (!groups[fam]) groups[fam] = [];
    groups[fam].push(m);
  }

  // Populate Family Filter Dropdown (only if it just has "All")
  if (globalFamilyFilter && globalFamilyFilter.options.length <= 1) {
    const allFamilies = new Set();
    for (const m of allModels) {
      allFamilies.add(modelMeta[m.model_id]?.isCustom ? 'Custom' : (modelMeta[m.model_id]?.family || 'Other'));
    }
    const sorted = Array.from(allFamilies).sort();
    let opts = '<option value="All">All Families</option>';
    for (const f of sorted) opts += `<option value="${f}">${f}</option>`;
    globalFamilyFilter.innerHTML = opts;
    globalFamilyFilter.value = currentFilter;
  }

  // Sort families
  const order = ['Custom', 'Llama', 'Qwen', 'DeepSeek', 'Phi', 'Gemma', 'SmolLM', 'Mistral', 'Hermes', 'Other'];
  const sortedFamilies = Object.keys(groups).sort((a, b) => {
    const ai = order.indexOf(a); const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Build option HTML
  const makeOptions = (defaultId) => {
    let html = '';
    for (const fam of sortedFamilies) {
      html += `<optgroup label="${fam} (${groups[fam].length})">`;
      for (const m of groups[fam]) {
        const meta = modelMeta[m.model_id];
        const label = `${meta.shortName} [${meta.quant}]${meta.vram ? ` ${meta.vram.toFixed(0)}MB` : ''}${meta.ctx ? ` ctx${meta.ctx}` : ''}`;
        html += `<option value="${m.model_id}" ${m.model_id === defaultId ? 'selected' : ''}>${label}</option>`;
      }
      html += '</optgroup>';
    }
    return html;
  };

  const defaultSmall = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
  const defaultLlama = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

  benchModelSelect.innerHTML = makeOptions(defaultSmall);
  chatModelSelect.innerHTML = makeOptions(defaultSmall);
  compareModelA.innerHTML = makeOptions(defaultSmall);
  compareModelB.innerHTML = makeOptions(defaultLlama);

  // Compare select in bench tab (add "none" option)
  compareSelect.innerHTML = `<option value="">— none —</option>${makeOptions('')}`;

  // Model count badge
  const badge = $('modelCountBadge');
  if (badge) badge.textContent = `${allModels.length} models`;

  // Wire up meta display
  const showMeta = (sel, el) => {
    const update = () => {
      const meta = modelMeta[sel.value];
      if (meta && el) el.innerHTML = modelMetaText(meta);
    };
    sel.addEventListener('change', update);
    update();
  };

  showMeta(benchModelSelect, benchModelMeta);
  showMeta(chatModelSelect, chatModelMeta);
  showMeta(compareModelA, compareMetaA);
  showMeta(compareModelB, compareMetaB);
}

/* ══════════════════════════════════════════════════════════════════════
   WEBGPU & WEBLLM
   ══════════════════════════════════════════════════════════════════════ */

async function getDeviceInfo() {
  if (deviceInfo) return deviceInfo;
  try {
    if (!navigator.gpu) throw new Error('WebGPU not available');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No GPU adapter found');
    const info = await adapter.requestAdapterInfo?.() || {};
    
    let estVramMB = 0;
    if (adapter.limits?.maxStorageBufferBindingSize) {
      estVramMB = Math.round((adapter.limits.maxStorageBufferBindingSize / (1024 * 1024)) * 2);
    }
    if (navigator.deviceMemory) {
      const ramMB = navigator.deviceMemory * 1024;
      estVramMB = Math.max(estVramMB, Math.round(ramMB * 0.5));
    }
    // Apple Silicon often caps maxStorage at 1-2GB regardless of RAM, fallback for M-series:
    if (/Mac|macOS|Apple/.test(info.architecture || navigator.platform || info.vendor)) {
      if (estVramMB < 4000) estVramMB = Math.max(estVramMB, 4000); // assume at least 4GB unified for modern Macs
    }

    deviceInfo = { gpu: info.description || info.device || 'Unknown GPU', vendor: info.vendor || 'Unknown', architecture: info.architecture || '', estVramMB, userAgent: navigator.userAgent, platform: navigator.platform, timestamp: new Date().toISOString() };
  } catch (err) {
    deviceInfo = { gpu: 'Unknown', vendor: 'Unknown', error: err.message, userAgent: navigator.userAgent, platform: navigator.platform, timestamp: new Date().toISOString() };
  }
  if (deviceInfoEl) {
    deviceInfoEl.textContent = `GPU: ${deviceInfo.gpu} | Vendor: ${deviceInfo.vendor} | Platform: ${deviceInfo.platform}`;
    // Keep device details in exported JSON, but hide this card in the public UI.
    deviceInfoEl.classList.add('hidden');
  }
  return deviceInfo;
}

async function ensureWebLLM(skipUrl = null) {
  if (webllm && (!skipUrl || webllmSourceUrl !== skipUrl)) return webllm;
  if (skipUrl && webllmSourceUrl === skipUrl) {
    webllm = null;
    webllmSourceUrl = '';
  }
  for (const url of WEBLLM_URLS) {
    if (skipUrl && url === skipUrl) continue;
    try {
      log(`Loading WebLLM from ${url}…`);
      webllm = await loadWebLLMRuntime(url);
      webllmSourceUrl = url;
      log('WebLLM loaded.');
      patchRuntimeScopeInModule(webllm);

      // Extract model registry
      const appConfig = webllm.prebuiltAppConfig || {};
      const list = appConfig.model_list || [];
      if (Array.isArray(list) && list.length > 0) {
        // merge remote list with custom local models
        const localCustomData = localStorage.getItem('webllm_custom_models');
        if (localCustomData) {
          try {
            const parsed = JSON.parse(localCustomData);
            if (Array.isArray(parsed)) {
              // Backward compatibility: older saved custom entries may miss is_custom flag.
              customModels = parsed.map((m) => ({ ...m, is_custom: true }));
            }
          } catch(e) {
            customModels = [];
          }
        }
        prebuiltModels = dedupeModelRecords(list).filter(m => m?.model_id && m?.model_lib);
        rebuildModelRegistry();
        log(`Discovered ${allModels.length} models in WebLLM registry.`);
        populateModelSelectors();
      }
      updateSourcePanel({ runtimeSource: url });
      return webllm;
    } catch (err) { log(`Failed: ${err.message}`); }
  }
  throw new Error('Could not load WebLLM.');
}

function buildEngineOptions(runtime, initProgressCallback, modelId) {
  const base = runtime?.prebuiltAppConfig || {};
  const cfg = JSON.parse(JSON.stringify(base));
  const record = allModels.find(m => m.model_id === modelId);
  const isCustom = Boolean(record?.is_custom);
  const useCache = Boolean(useIndexedDBCacheCheckbox?.checked) && !isCustom;
  // Inject all models (including custom) so WebLLM can route to them
  const modelList = allModels.length > 0 ? allModels : (base.model_list || []);
  cfg.model_list = dedupeModelRecords(modelList);
  cfg.useIndexedDBCache = useCache;
  return {
    initProgressCallback,
    appConfig: cfg,
    effectiveCacheMode: useCache ? 'IndexedDB' : 'network',
    isCustomModel: isCustom,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   ENGINE MANAGEMENT
   ══════════════════════════════════════════════════════════════════════ */

async function loadModel(modelId, progressFn) {
  let runtime = await ensureWebLLM();
  installFetchTracer();

  if (engine && activeModelId === modelId) { log(`Already loaded: ${modelId}`); return; }

  if (engine) {
    log(`Unloading ${activeModelId}…`);
    try { await engine.unload(); } catch { /* ok */ }
    engine = null; activeModelId = null;
  }

  log(`Loading model: ${modelId}…`);
  observedModelFetchUrls = [];

  const meta = modelMeta[modelId] || {};
  
  // VRAM Warning
  if (deviceInfo?.estVramMB && meta.vram) {
    if (meta.vram > deviceInfo.estVramMB * 1.05) {
      log(`⚠ Warning: ${meta.shortName || modelId} needs ~${meta.vram.toFixed(0)}MB VRAM, but device est is ~${deviceInfo.estVramMB}MB.`);
      showStatus('warning', `Warning: This model requires ~${meta.vram.toFixed(0)}MB VRAM. Your device may only have ~${deviceInfo.estVramMB}MB available.`);
    }
  }
  const record = allModels.find(m => m.model_id === modelId);

  const initProgressCallback = (report) => {
    const pct = Math.round(report.progress * 100);
    if (progressFn) progressFn(pct, report.text);
  };
  const opts = buildEngineOptions(runtime, initProgressCallback, modelId);
  if (opts.isCustomModel && useIndexedDBCacheCheckbox?.checked) {
    log('ℹ Custom model: forcing network mode (IndexedDB disabled) to avoid stale local artifact conflicts.');
  }

  captureModelFetchUrls = true;
  let samplerRuntimeRetried = false;
  try {
    while (true) {
      try {
        let createErr = null;
        if (typeof runtime.CreateMLCEngine === 'function') {
          try {
            engine = await runtime.CreateMLCEngine(modelId, opts);
          } catch (err) {
            createErr = err;
            log(`CreateMLCEngine failed (${err?.message || err}). Trying MLCEngine reload fallback...`);
          }
        }
        if (!engine) {
          if (createErr && !runtime.MLCEngine) throw createErr;
          engine = new runtime.MLCEngine(opts);
          await engine.reload(modelId);
        }
        inspectAndPatchRuntimeGraph(engine, `engine:${modelId}`, 10);
        // Health check
        await engine.chat.completions.create({ messages: [{ role: 'user', content: 'hi' }], max_tokens: 1, temperature: 0 });
        break;
      } catch (err) {
        const msg = String(err?.message || err || '');
        if (engine) { try { await engine.unload(); } catch { /* noop */ } }
        engine = null;
        activeModelId = null;

        if (!samplerRuntimeRetried && msg.includes('fargsortProbs is not a function')) {
          samplerRuntimeRetried = true;
          const failedUrl = webllmSourceUrl;
          log('Sampler fallback missing in active runtime; reloading runtime from alternate source and retrying once...');
          try {
            webllm = null;
            webllmSourceUrl = '';
            runtime = await ensureWebLLM(failedUrl);
          } catch (reloadErr) {
            throw new Error(`Model init failed (${msg}). Runtime fallback reload also failed: ${reloadErr?.message || reloadErr}`);
          }
          continue;
        }
        if (msg.includes('Value attached to scope multiple times')) {
          throw new Error('Model init failed (scope attach duplication). Use "Add Local 8k Preset" or clear Local Model Files and use URL mode.');
        }
        if (msg.includes('fargsortProbs is not a function')) {
          throw new Error('Model init failed: runtime sampler functions missing. Hard refresh (Cmd+Shift+R) and retry; if it persists, switch runtime source by reloading once.');
        }
        throw err;
      }
    }
  } finally { captureModelFetchUrls = false; }

  activeModelId = modelId;

  updateSourcePanel({
    runtimeSource: webllmSourceUrl,
    cacheMode: opts.effectiveCacheMode,
    modelRoot: record?.model || '?',
    modelLib: record?.model_lib || '?',
    urls: uniqUrls(observedModelFetchUrls).slice(0, 25),
  });
  log(`Model loaded: ${modelId}`);
}

/* ══════════════════════════════════════════════════════════════════════
   PROMPT + SINGLE RUN
   ══════════════════════════════════════════════════════════════════════ */

function makePrompt(targetTokens) {
  const base = 'The quick brown fox jumps over the lazy dog. ';
  const repeats = Math.max(1, Math.ceil(targetTokens / (base.split(' ').length * 1.3)));
  return base.repeat(repeats);
}

async function runOne(promptTokens, maxTokens, forceIgnoreEos = false) {
  const prompt = makePrompt(promptTokens);
  const msgs = [{ role: 'system', content: 'Answer briefly and directly.' }, { role: 'user', content: prompt }];
  const req = { messages: msgs, max_tokens: maxTokens, temperature: 0 };
  if (forceIgnoreEos || forceFullLengthCheckbox?.checked) req.ignore_eos = true;
  // Disable thinking for benchmark runs — thinking tokens waste the token budget on CoT
  if (isThinkingModel(activeModelId)) req.enable_thinking = false;

  const t0 = performance.now();
  let result;
  try {
    result = await engine.chat.completions.create(req);
    if (req.ignore_eos) ignoreEosSupport = 'supported';
  } catch (err) {
    if (!req.ignore_eos) throw err;
    result = await engine.chat.completions.create({ messages: msgs, max_tokens: maxTokens, temperature: 0 });
    ignoreEosSupport = 'fallback';
  }
  const ms = performance.now() - t0;
  const usage = result?.usage || {}; const extra = usage.extra || {};
  const outTok = usage.completion_tokens || Math.ceil((result?.choices?.[0]?.message?.content || '').split(/\s+/).length * 1.3);
  const tps = outTok > 0 ? outTok / (ms / 1000) : 0;
  return {
    totalMs: +ms.toFixed(2), outTokens: outTok, tps: +tps.toFixed(3),
    prefillTps: +(extra.prefill_tokens_per_s || 0).toFixed(3),
    decodeTps: +(extra.decode_tokens_per_s || 0).toFixed(3),
    ttft: +(extra.time_to_first_token_s || 0).toFixed(4),
    tokenSource: usage.completion_tokens ? 'usage' : 'estimate',
    text: (result?.choices?.[0]?.message?.content || '').slice(0, 80),
  };
}

async function runBenchmark(modelId, config, progressFn) {
  const { promptTokens, maxTokens, iterations, forceIgnoreEos } = config;
  const meta = modelMeta[modelId] || {};
  const name = meta.shortName || modelId;
  const record = allModels.find(m => m.model_id === modelId);
  const memBefore = getRuntimeMemorySnapshot();

  await loadModel(modelId, (pct, text) => { if (progressFn) progressFn(pct * 0.85, `Loading ${name}…`); });

  log('Warming up…');
  if (progressFn) progressFn(0, 'Warmup…');
  await runOne(Math.min(256, promptTokens), Math.min(16, maxTokens), forceIgnoreEos);

  const runs = [];
  for (let i = 0; i < iterations; i++) {
    if (progressFn) progressFn(((i + 1) / iterations) * 100, `Run ${i + 1}/${iterations}…`);
    const run = await runOne(promptTokens, maxTokens, forceIgnoreEos);
    runs.push(run);
    log(`  run ${i + 1}: ${run.totalMs.toFixed(0)}ms | ${run.outTokens} tok | ${run.tps.toFixed(1)} tok/s`);
  }

  const totalMs = runs.reduce((s, r) => s + r.totalMs, 0);
  const totalOut = runs.reduce((s, r) => s + r.outTokens, 0);
  const lats = runs.map(r => r.totalMs).sort((a, b) => a - b);
  const p95 = Math.max(0, Math.ceil(lats.length * 0.95) - 1);
  const memAfter = getRuntimeMemorySnapshot();
  const heapDeltaMB =
    Number.isFinite(memBefore.jsHeapUsedMB) && Number.isFinite(memAfter.jsHeapUsedMB)
      ? +(memAfter.jsHeapUsedMB - memBefore.jsHeapUsedMB).toFixed(2)
      : null;

  const summary = {
    modelId, config: { promptTokens, maxTokens, iterations },
    modelMeta: {
      shortName: meta.shortName || modelId,
      family: meta.family || 'Other',
      size: meta.size || '?',
      quant: meta.quant || '?',
      vramMB: Number.isFinite(meta.vram) ? meta.vram : null,
      contextWindow: Number.isFinite(meta.ctx) ? meta.ctx : null,
      lowResource: Boolean(meta.lowRes),
      isCustom: Boolean(meta.isCustom),
    },
    modelRecord: {
      modelRoot: record?.model || null,
      modelLib: record?.model_lib || null,
    },
    avgMs: +(totalMs / iterations).toFixed(2),
    p95Ms: +lats[p95].toFixed(2),
    avgTps: +(runs.reduce((s, r) => s + r.tps, 0) / iterations).toFixed(3),
    avgOutTokens: +(totalOut / iterations).toFixed(1),
    avgMsPerTok: +(totalOut > 0 ? totalMs / totalOut : 0).toFixed(2),
    avgPrefillTps: +(runs.reduce((s, r) => s + r.prefillTps, 0) / iterations).toFixed(3),
    avgEngineDecodeTps: +(runs.reduce((s, r) => s + r.decodeTps, 0) / iterations).toFixed(3),
    avgTtft: +(runs.reduce((s, r) => s + r.ttft, 0) / iterations).toFixed(4),
    tokenSource: runs.every(r => r.tokenSource === 'usage') ? 'usage' : 'mixed',
    runtimeMemory: {
      before: memBefore,
      after: memAfter,
      jsHeapDeltaMB: heapDeltaMB,
    },
    runs,
  };
  log(`✓ ${modelId}: avg=${summary.avgMs.toFixed(0)}ms | TPS=${summary.avgTps.toFixed(1)} | decode=${summary.avgEngineDecodeTps.toFixed(1)} tok/s | TTFT=${summary.avgTtft}s`);
  return summary;
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 1 — BENCHMARK
   ══════════════════════════════════════════════════════════════════════ */

function renderMetricRow(l, v, u) { return `<tr><td class="metric-label">${l}</td><td class="metric-value">${v} <span class="metric-unit">${u}</span></td></tr>`; }

function renderSummaryTable(s) {
  return `<table class="results-table"><thead><tr><th>Metric</th><th>${s.modelId}</th></tr></thead><tbody>
    ${renderMetricRow('Avg Latency', s.avgMs.toFixed(0), 'ms')}${renderMetricRow('P95 Latency', s.p95Ms.toFixed(0), 'ms')}
    ${renderMetricRow('Throughput', s.avgTps.toFixed(2), 'tok/s')}${renderMetricRow('Decode TPS', s.avgEngineDecodeTps.toFixed(2), 'tok/s')}
    ${renderMetricRow('Prefill TPS', s.avgPrefillTps.toFixed(2), 'tok/s')}${renderMetricRow('TTFT', (s.avgTtft * 1000).toFixed(0), 'ms')}
    ${renderMetricRow('Output Tokens', s.avgOutTokens.toFixed(1), 'tok')}${renderMetricRow('ms/token', s.avgMsPerTok.toFixed(1), 'ms')}
  </tbody></table>`;
}

function renderCompareTable(a, b) {
  const row = (l, av, bv, u, hib = true) => {
    const d = bv - av; const pct = av !== 0 ? ((d / Math.abs(av)) * 100).toFixed(1) : '—';
    const s = d > 0 ? '+' : ''; const cls = hib ? (d > 1 ? 'delta-positive' : d < -1 ? 'delta-negative' : 'delta-neutral') : (d < -1 ? 'delta-positive' : d > 1 ? 'delta-negative' : 'delta-neutral');
    return `<tr><td class="metric-label">${l}</td><td class="metric-value">${av} <span class="metric-unit">${u}</span></td><td class="metric-value">${bv} <span class="metric-unit">${u}</span></td><td class="${cls}">${s}${pct}%</td></tr>`;
  };
  return `<table class="results-table"><thead><tr><th>Metric</th><th>${a.modelId}</th><th>${b.modelId}</th><th>Δ</th></tr></thead><tbody>
    ${row('Latency', +a.avgMs.toFixed(0), +b.avgMs.toFixed(0), 'ms', false)}${row('Throughput', +a.avgTps.toFixed(2), +b.avgTps.toFixed(2), 'tok/s', true)}
    ${row('Decode', +a.avgEngineDecodeTps.toFixed(2), +b.avgEngineDecodeTps.toFixed(2), 'tok/s', true)}${row('Prefill', +a.avgPrefillTps.toFixed(2), +b.avgPrefillTps.toFixed(2), 'tok/s', true)}
    ${row('TTFT', +(a.avgTtft * 1000).toFixed(0), +(b.avgTtft * 1000).toFixed(0), 'ms', false)}${row('Tokens', +a.avgOutTokens.toFixed(1), +b.avgOutTokens.toFixed(1), 'tok', true)}
    ${row('ms/tok', +a.avgMsPerTok.toFixed(1), +b.avgMsPerTok.toFixed(1), 'ms', false)}
  </tbody></table>`;
}

async function handleRun() {
  const modelId = benchModelSelect.value;
  const cmpId = compareSelect.value;
  const config = { promptTokens: +promptTokensSel.value, maxTokens: +maxTokensSel.value, iterations: +iterationsSel.value };
  runBtn.disabled = true; exportBtn.disabled = true; clearStatus(); resultsCard.classList.add('hidden');
  try {
    const dev = await getDeviceInfo();
    const sa = await runBenchmark(modelId, config, (p, t) => setElProgress(progressWrap, progressBar, progressText, p, t));
    let sb = null;
    if (cmpId && cmpId !== modelId) {
      try { await engine.unload(); } catch {} engine = null; activeModelId = null;
      log(`\nComparison: ${cmpId}`);
      sb = await runBenchmark(cmpId, config, (p, t) => setElProgress(progressWrap, progressBar, progressText, p, t));
    }
    lastReport = { version: '2.0.0', tool: 'webllm-bench', type: 'benchmark', generatedAt: new Date().toISOString(), device: dev, config, results: sb ? [sa, sb] : [sa] };
    resultsContent.innerHTML = sb ? renderCompareTable(sa, sb) : renderSummaryTable(sa);
    resultsCard.classList.remove('hidden'); exportBtn.disabled = false;
    hideElProgress(progressWrap); showStatus('success', `Benchmark complete.`);
    trackUsageEvent('benchmark_run', {
      model_id: modelId,
      compare_model_id: cmpId || null,
      prompt_tokens: config.promptTokens,
      max_tokens: config.maxTokens,
      iterations: config.iterations,
    }).catch(() => {});
    refreshLiveCounters().catch(() => {});
  } catch (err) { hideElProgress(progressWrap); showStatus('error', err.message); log(`ERROR: ${err.message}`); }
  finally { runBtn.disabled = false; }
}

function handleExport() {
  if (!lastReport) return showStatus('error', 'No report yet.');
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '');
    const fn = `webllm-bench-${ts}.json`;
    const b = new Blob([JSON.stringify(lastReport, null, 2) + '\n'], { type: 'application/json' });
    const u = URL.createObjectURL(b); const a = document.createElement('a');
    a.href = u; a.download = fn; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1200);
    showStatus('success', `Exported: ${fn}`);
  } catch (e) { showStatus('error', `Export failed: ${e.message}`); }
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 2 — CHAT & TEST (streaming)
   ══════════════════════════════════════════════════════════════════════ */

function renderChatMsg(role, text, meta) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;

  // For assistant messages: detect <think> blocks and render them separately
  if (role === 'assistant') {
    const { thinking, answer, hasThinking } = parseThinkingOutput(text);
    if (hasThinking && thinking) {
      const thinkWrap = document.createElement('details');
      thinkWrap.style.cssText = 'margin-bottom:8px; font-size:11px; color:var(--text-muted); border:1px solid var(--border); border-radius:6px; padding:6px 8px; background:var(--bg-input);';
      const summary = document.createElement('summary');
      summary.style.cssText = 'cursor:pointer; font-weight:600; font-size:11px; color:var(--text-secondary);';
      summary.textContent = `🧠 Thinking (${thinking.split(/\s+/).length} words)`;
      thinkWrap.appendChild(summary);
      const thinkContent = document.createElement('pre');
      thinkContent.style.cssText = 'white-space:pre-wrap; margin-top:4px; font-size:11px; line-height:1.4; max-height:200px; overflow-y:auto;';
      thinkContent.textContent = thinking;
      thinkWrap.appendChild(thinkContent);
      div.appendChild(thinkWrap);

      if (answer) {
        const answerDiv = document.createElement('div');
        answerDiv.textContent = answer;
        div.appendChild(answerDiv);
      } else {
        const noAnswer = document.createElement('div');
        noAnswer.style.cssText = 'font-style:italic; color:var(--yellow); font-size:12px;';
        noAnswer.textContent = '⚠ Model used all tokens for thinking — no answer produced. Try increasing max tokens.';
        div.appendChild(noAnswer);
      }
    } else {
      div.textContent = text;
    }
  } else {
    div.textContent = text;
  }

  if (meta) {
    const m = document.createElement('div');
    m.className = 'msg-meta';
    m.textContent = meta;
    div.appendChild(m);
  }
  return div;
}

async function handleChatLoad() {
  const modelId = chatModelSelect.value;
  chatLoadBtn.disabled = true;
  clearStatus();
  try {
    await loadModel(modelId, (pct, text) => setElProgress(chatProgressWrap, chatProgressBar, chatProgressText, pct, text));
    hideElProgress(chatProgressWrap);
    chatModelLoaded = true;
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    log(`Chat model ready: ${modelId}`);
    if (chatGroundFacts?.checked) {
      log(`ℹ Chat grounding enabled for ${modelMeta[modelId]?.shortName || modelId} (model/date facts).`);
    }
    showStatus('success', `Model loaded. Start chatting!`);

    // Clear old messages
    chatMessages.innerHTML = '';
    chatHistory = [];
  } catch (err) {
    hideElProgress(chatProgressWrap);
    showStatus('error', err.message);
    log(`Chat load error: ${err.message}`);
  } finally { chatLoadBtn.disabled = false; }
}

async function handleChatSend() {
  const text = chatInput.value.trim();
  if (!text || !chatModelLoaded || !engine) return;

  chatInput.value = '';
  chatSendBtn.disabled = true;

  // Add user message
  chatMessages.appendChild(renderChatMsg('user', text));
  chatHistory.push({ role: 'user', content: text });

  // Hard guardrail for identity/date questions when grounding is enabled.
  if (chatGroundFacts?.checked) {
    const intent = detectLocalFactIntent(text);
    if (intent.asksDate || intent.asksModel || intent.asksCutoff) {
      const localReply = buildLocalFactReply(intent, activeModelId || chatModelSelect.value);
      chatMessages.appendChild(renderChatMsg('assistant', localReply, 'local facts · no model inference'));
      chatHistory.push({ role: 'assistant', content: localReply });
      chatSendBtn.disabled = false;
      chatInput.focus();
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return;
    }
  }

  // Build messages with system prompt
  const system = chatSystemPrompt.value.trim();
  const grounded = chatGroundFacts?.checked ? buildGroundedChatPreamble(activeModelId || chatModelSelect.value) : '';
  const systemCombined = [grounded, system].filter(Boolean).join('\n\n');
  const historyWindow = getPromptHistoryWindow(chatHistory);
  const messages = systemCombined ? [{ role: 'system', content: systemCombined }, ...historyWindow] : [...historyWindow];

  const maxTokens = +chatMaxTokens.value;
  const config = {
    messages,
    max_tokens: maxTokens,
    temperature: +chatTemp.value,
    top_p: +chatTopP.value,
    stream: true,
  };
  const chatWindow = String(chatWindowMode?.value || 'auto');
  const slidingTokens = clampInt(chatSlidingWindow?.value, 4096, 0, 65536);
  if (chatWindow === 'sliding' && slidingTokens > 0) {
    config.sliding_window_size = slidingTokens;
  }

  // Create temporary streaming div
  const streamDiv = document.createElement('div');
  streamDiv.className = 'chat-msg assistant';
  streamDiv.textContent = '';
  chatMessages.appendChild(streamDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const t0 = performance.now();
  let fullText = '';
  let tokenCount = 0;

  try {
    let stream;
    try {
      stream = await engine.chat.completions.create(config);
    } catch (err) {
      const msg = String(err?.message || err || '');
      if (config.sliding_window_size) {
        log(`ℹ sliding_window_size rejected (${msg}). Retrying chat without it…`);
        delete config.sliding_window_size;
        stream = await engine.chat.completions.create(config);
      } else {
        throw err;
      }
    }

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        tokenCount++;
        // During streaming, show raw text for responsiveness
        streamDiv.textContent = fullText;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    const elapsed = performance.now() - t0;
    const tps = tokenCount > 0 ? (tokenCount / (elapsed / 1000)).toFixed(1) : '?';
    const likelyTruncated = tokenCount >= Math.max(1, maxTokens - 1);
    const windowMeta = chatWindow === 'sliding' && slidingTokens > 0 ? ` · window:${slidingTokens}` : '';
    const histMeta = `${chatUseHistory?.checked !== false ? clampInt(chatHistoryTurns?.value, 14, 1, 50) : 0} turns`;
    const metaStr = `${tokenCount} tokens · ${(elapsed / 1000).toFixed(1)}s · ${tps} tok/s · hist:${histMeta}${windowMeta}${likelyTruncated ? ' · ⚠ may be truncated (max tokens reached)' : ''}`;

    // Replace streaming div with properly rendered message (handles <think> blocks)
    const rendered = renderChatMsg('assistant', fullText, metaStr);
    chatMessages.replaceChild(rendered, streamDiv);

    chatHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    streamDiv.textContent = `Error: ${err.message}`;
    streamDiv.style.color = 'var(--red)';
    log(`Chat error: ${err.message}`);
  }

  chatSendBtn.disabled = false;
  chatInput.focus();
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatClear() {
  chatHistory = [];
  chatMessages.innerHTML = '<div class="chat-empty"><div class="chat-empty-icon">💬</div>Conversation cleared. Start fresh.</div>';
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 3 — COMPARE (side-by-side)
   ══════════════════════════════════════════════════════════════════════ */

async function runModelChat(modelId, prompt, maxTokens, temperature) {
  await loadModel(modelId, (pct, text) => setElProgress(compareProgressWrap, compareProgressBar, compareProgressText, pct, `Loading ${modelMeta[modelId]?.shortName || modelId}…`));

  const thinking = isThinkingModel(modelId);
  const sysContent = thinking
    ? 'You are a helpful assistant. /no_think'
    : 'You are a helpful assistant.';
  const messages = [
    { role: 'system', content: sysContent },
    { role: 'user', content: prompt },
  ];

  if (thinking) log(`ℹ ${modelMeta[modelId]?.shortName}: /no_think prompt injected for fair comparison`);

  const request = { messages, max_tokens: maxTokens, temperature };
  const compareSliding = clampInt(compareSlidingWindow?.value, 0, 0, 65536);
  if (compareSliding > 0) request.sliding_window_size = compareSliding;

  const t0 = performance.now();
  let result;
  try {
    result = await engine.chat.completions.create(request);
  } catch (err) {
    const msg = String(err?.message || err || '');
    if (request.sliding_window_size) {
      log(`ℹ ${modelMeta[modelId]?.shortName}: sliding_window_size rejected (${msg}). Retrying without it…`);
      delete request.sliding_window_size;
      result = await engine.chat.completions.create(request);
    } else {
      throw err;
    }
  }
  const elapsed = performance.now() - t0;

  let text = result?.choices?.[0]?.message?.content || '';
  const usage = result?.usage || {};
  const extra = usage.extra || {};
  const outTok = usage.completion_tokens || 0;
  const truncated = outTok >= maxTokens - 1;

  // Strip any residual <think> blocks for display
  const parsed = parseThinkingOutput(text);
  const displayText = parsed.hasThinking
    ? (parsed.answer || `[thinking only — ${parsed.thinking.split(/\s+/).length} words of reasoning, no answer. Try higher max tokens.]`)
    : text;
  const hadThinking = parsed.hasThinking;

  const tps = outTok > 0 ? (outTok / (elapsed / 1000)).toFixed(1) : '?';
  const decodeTps = extra.decode_tokens_per_s || 0;
  const ttft = extra.time_to_first_token_s || 0;

  return { text: displayText, elapsed, outTok, tps, decodeTps: decodeTps.toFixed(1), ttft: (ttft * 1000).toFixed(0), prefillTps: (extra.prefill_tokens_per_s || 0).toFixed(0), hadThinking, truncated, maxTokens };
}

function formatCompareMetrics(res) {
  let line = `${res.outTok} tok · ${(res.elapsed / 1000).toFixed(1)}s · ${res.tps} tok/s · decode: ${res.decodeTps} · TTFT: ${res.ttft}ms`;
  const tags = [];
  if (res.hadThinking) tags.push('<span style="color:var(--purple);">🧠 thinking stripped</span>');
  if (res.truncated) tags.push(`<span style="color:var(--yellow);">⚠ truncated at ${res.maxTokens} tokens</span>`);
  if (tags.length) line += ' · ' + tags.join(' · ');
  return line;
}

async function handleCompare() {
  const idA = compareModelA.value;
  const idB = compareModelB.value;
  const prompt = comparePrompt.value.trim();
  const maxTok = +compareMaxTokens.value;
  const temp = +compareTemp.value;

  if (!prompt) return showStatus('error', 'Enter a prompt.');
  if (idA === idB) return showStatus('error', 'Pick two different models.');

  compareRunBtn.disabled = true;
  clearStatus();
  compareResultsCard.classList.remove('hidden');
  compareResponseA.textContent = 'Loading…';
  compareResponseB.textContent = 'Waiting…';
  compareMetricsA.textContent = '';
  compareMetricsB.textContent = '';
  compareHeaderA.textContent = modelMeta[idA]?.shortName || idA;
  compareHeaderB.textContent = modelMeta[idB]?.shortName || idB;

  try {
    // Run Model A
    setElProgress(compareProgressWrap, compareProgressBar, compareProgressText, 10, `Running ${modelMeta[idA]?.shortName}…`);
    const resA = await runModelChat(idA, prompt, maxTok, temp);
    compareResponseA.textContent = resA.text;
    const metricsA = formatCompareMetrics(resA);
    compareMetricsA.innerHTML = metricsA;

    // Unload for Model B
    try { await engine.unload(); } catch {} engine = null; activeModelId = null;
    compareResponseB.textContent = 'Loading…';

    // Run Model B
    setElProgress(compareProgressWrap, compareProgressBar, compareProgressText, 55, `Running ${modelMeta[idB]?.shortName}…`);
    const resB = await runModelChat(idB, prompt, maxTok, temp);
    compareResponseB.textContent = resB.text;
    const metricsB = formatCompareMetrics(resB);
    compareMetricsB.innerHTML = metricsB;

    hideElProgress(compareProgressWrap);
    showStatus('success', 'Comparison complete.');
    trackUsageEvent('compare_run', {
      model_a: idA,
      model_b: idB,
      max_tokens: maxTok,
      temperature: temp,
    }).catch(() => {});
    refreshLiveCounters().catch(() => {});

  } catch (err) {
    hideElProgress(compareProgressWrap);
    showStatus('error', err.message);
    log(`Compare error: ${err.message}`);
  } finally { compareRunBtn.disabled = false; }
}

/* ══════════════════════════════════════════════════════════════════════
   TAB 4 — FIND BEST MODEL (sweep + score)
   ══════════════════════════════════════════════════════════════════════ */

function getSweepModels() {
  const filter = sweepModelFilter.value;
  if (filter === 'lowResource') return allModels.filter(m => modelMeta[m.model_id]?.lowRes);
  if (filter === 'small') return allModels.filter(m => { const v = modelMeta[m.model_id]?.vram || 0; return v > 0 && v <= 3000; });
  return allModels.filter(m => !modelMeta[m.model_id]?.isVLM); // "all" excludes VLM
}

function scoreModels(summaries, useCase) {
  const profile = USE_CASE_PROFILES[useCase] || USE_CASE_PROFILES.chatbot;
  const w = profile.weights;
  const metrics = summaries.map(s => ({
    modelId: s.modelId,
    ttft: s.avgTtft > 0 ? 1 / s.avgTtft : 0,
    decodeTps: s.avgEngineDecodeTps,
    prefillTps: s.avgPrefillTps,
    msPerTok: s.avgMsPerTok > 0 ? 1 / s.avgMsPerTok : 0,
  }));
  const keys = ['ttft', 'decodeTps', 'prefillTps', 'msPerTok'];
  const mins = {}; const maxs = {};
  for (const k of keys) { const vals = metrics.map(m => m[k]); mins[k] = Math.min(...vals); maxs[k] = Math.max(...vals); }
  const scored = metrics.map(m => {
    const n = {};
    for (const k of keys) { const r = maxs[k] - mins[k]; n[k] = r > 0 ? (m[k] - mins[k]) / r : 0.5; }
    const score = w.ttft * n.ttft + w.decodeTps * n.decodeTps + w.prefillTps * n.prefillTps + w.msPerTok * n.msPerTok;
    return { modelId: m.modelId, score: +(score * 100).toFixed(1), n };
  }).sort((a, b) => b.score - a.score);
  return { scored, profile };
}

function renderSweepResults(report, useCase) {
  const sums = report.results;
  const { scored, profile } = scoreModels(sums, useCase);
  const w = scored[0]; const ws = sums.find(s => s.modelId === w.modelId);
  const meta = modelMeta[w.modelId] || {};

  recCard.classList.remove('hidden');
  recModelEl.textContent = meta.shortName || w.modelId;
  recReasonEl.textContent = `Best for ${profile.name}. ${profile.reason}`;
  recScoresEl.innerHTML = `
    <div class="rec-score"><div class="rec-score-value">${ws.avgEngineDecodeTps.toFixed(1)}</div><div class="rec-score-label">Decode tok/s</div></div>
    <div class="rec-score"><div class="rec-score-value">${(ws.avgTtft * 1000).toFixed(0)}</div><div class="rec-score-label">TTFT (ms)</div></div>
    <div class="rec-score"><div class="rec-score-value">${ws.avgPrefillTps.toFixed(0)}</div><div class="rec-score-label">Prefill tok/s</div></div>
    <div class="rec-score"><div class="rec-score-value">${w.score.toFixed(0)}</div><div class="rec-score-label">Score /100</div></div>`;

  const medals = ['🥇', '🥈', '🥉', '4', '5', '6', '7', '8', '9', '10'];
  const maxS = scored[0].score;
  let rows = scored.map((s, i) => {
    const sm = sums.find(x => x.modelId === s.modelId);
    const m = modelMeta[s.modelId] || {};
    const bar = maxS > 0 ? (s.score / maxS * 100) : 0;
    return `<tr class="${i === 0 ? 'rank-1' : ''}">
      <td><span class="rank-medal">${medals[i] || i + 1}</span></td>
      <td style="font-weight:600;">${m.shortName || s.modelId}</td>
      <td><span class="rank-score">${s.score.toFixed(1)}</span><div class="rank-bar-bg"><div class="rank-bar" style="width:${bar}%"></div></div></td>
      <td class="metric-value">${sm.avgEngineDecodeTps.toFixed(1)} <span class="metric-unit">tok/s</span></td>
      <td class="metric-value">${(sm.avgTtft * 1000).toFixed(0)} <span class="metric-unit">ms</span></td>
      <td class="metric-value">${sm.avgPrefillTps.toFixed(0)} <span class="metric-unit">tok/s</span></td>
      <td class="metric-value">${sm.avgMsPerTok.toFixed(1)} <span class="metric-unit">ms</span></td></tr>`;
  });

  rankCard.classList.remove('hidden');
  rankContent.innerHTML = `<table class="rank-table"><thead><tr><th></th><th>Model</th><th>Score</th><th>Decode</th><th>TTFT</th><th>Prefill</th><th>ms/tok</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

async function handleSweep() {
  const useCase = selectedUseCase;
  const models = getSweepModels();
  const config = { promptTokens: 1024, maxTokens: 64, iterations: 2, forceIgnoreEos: true };

  if (models.length === 0) return showStatus('error', 'No models match the filter. Load WebLLM first.');

  sweepBtn.disabled = true; runBtn.disabled = true; clearStatus();
  recCard.classList.add('hidden'); rankCard.classList.add('hidden');

  const summaries = []; const failed = [];
  const total = models.length;

  try {
    const dev = await getDeviceInfo();
    for (let i = 0; i < total; i++) {
      const m = models[i]; const name = modelMeta[m.model_id]?.shortName || m.model_id;
      setSweepProgress(i / total * 100, `Loading ${name} (${i + 1}/${total})…`);
      log(`\n═══ Sweep ${i + 1}/${total}: ${name} ═══`);
      try {
        const s = await runBenchmark(m.model_id, config, (p, t) => setSweepProgress((i / total + p / 100 / total) * 100, `${name}: ${t}`));
        summaries.push(s);
        if (engine) { try { await engine.unload(); } catch {} engine = null; activeModelId = null; }
      } catch (err) {
        log(`ERROR: ${name}: ${err.message}`); failed.push({ modelId: m.model_id, error: err.message });
        if (engine) { try { await engine.unload(); } catch {} engine = null; activeModelId = null; }
      }
    }
    if (summaries.length === 0) throw new Error('All models failed.');

    lastSweepReport = { version: '2.0.0', tool: 'webllm-bench', type: 'sweep', generatedAt: new Date().toISOString(), device: dev, useCase, config, results: summaries, failed };
    renderSweepResults(lastSweepReport, useCase);
    hideSweepProgress(); showStatus('success', `Sweep: ${summaries.length}/${total} tested.${failed.length ? ` ${failed.length} failed.` : ''}`);
    shareBtn.disabled = false; exportSweepBtn.disabled = false;
    addBaseline(lastSweepReport);
    trackUsageEvent('sweep_run', {
      use_case: useCase,
      tested_models: summaries.length,
      failed_models: failed.length,
    }).catch(() => {});
    refreshLiveCounters().catch(() => {});
  } catch (err) { hideSweepProgress(); showStatus('error', err.message); }
  finally { sweepBtn.disabled = false; runBtn.disabled = false; }
}

function setSweepProgress(p, t) { setElProgress(sweepProgressWrap, sweepProgressBar, sweepProgressText, p, t); }
function hideSweepProgress() { hideElProgress(sweepProgressWrap); }

/* ══════════════════════════════════════════════════════════════════════
   TAB 5 — COMMUNITY
   ══════════════════════════════════════════════════════════════════════ */

const BL_KEY = 'webllm-bench-community-baselines';

function loadSavedBaselines() {
  try { const r = localStorage.getItem(BL_KEY); if (r) { communityBaselines = JSON.parse(r); updateBaselineUI(); } } catch {}
}
function saveBaselines() { try { localStorage.setItem(BL_KEY, JSON.stringify(communityBaselines)); } catch {} }

function addBaseline(report) {
  communityBaselines.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
    device: report.device,
    results: report.results.map(r => ({ modelId: r.modelId, avgEngineDecodeTps: r.avgEngineDecodeTps, avgPrefillTps: r.avgPrefillTps, avgTtft: r.avgTtft, avgMsPerTok: r.avgMsPerTok, avgTps: r.avgTps, avgOutTokens: r.avgOutTokens })),
  });
  saveBaselines(); updateBaselineUI();
}

function updateBaselineUI() {
  baselineCountEl.textContent = `${communityBaselines.length} baseline${communityBaselines.length !== 1 ? 's' : ''}`;
  if (communityBaselines.length > 0) { leaderboardCard.classList.remove('hidden'); renderLeaderboard(); }
}

function renderLeaderboard() {
  const agg = {};
  for (const bl of communityBaselines) for (const r of bl.results) {
    if (!agg[r.modelId]) agg[r.modelId] = { d: [], p: [], t: [], m: [], devs: new Set() };
    const a = agg[r.modelId];
    a.d.push(r.avgEngineDecodeTps); a.p.push(r.avgPrefillTps);
    if (r.avgTtft > 0) a.t.push(r.avgTtft);
    if (r.avgMsPerTok > 0) a.m.push(r.avgMsPerTok);
    a.devs.add(bl.device?.gpu || '?');
  }
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const rows = Object.entries(agg).map(([id, a]) => ({ id, d: avg(a.d), p: avg(a.p), t: avg(a.t), m: avg(a.m), n: a.d.length, devs: [...a.devs].join(', ') })).sort((a, b) => b.d - a.d);

  leaderboardContent.innerHTML = `<table class="rank-table"><thead><tr><th>Model</th><th>Decode</th><th>Prefill</th><th>TTFT</th><th>ms/tok</th><th>Runs</th></tr></thead><tbody>
    ${rows.map(r => { const m = modelMeta[r.id]; return `<tr><td style="font-weight:600;">${m?.shortName || r.id}</td><td class="metric-value">${r.d.toFixed(1)} <span class="metric-unit">tok/s</span></td><td class="metric-value">${r.p.toFixed(0)} <span class="metric-unit">tok/s</span></td><td class="metric-value">${(r.t * 1000).toFixed(0)} <span class="metric-unit">ms</span></td><td class="metric-value">${r.m.toFixed(1)} <span class="metric-unit">ms</span></td><td>${r.n}</td></tr>`; }).join('')}
  </tbody></table>`;
}

function handleShare() {
  const r = lastSweepReport || lastReport;
  if (!r) return showStatus('error', 'No results to share.');
  const j = JSON.stringify(r, null, 2);
  try { navigator.clipboard.writeText(j); showStatus('success', 'Copied!'); } catch { showStatus('error', 'Copy failed.'); }
  shareCard.classList.remove('hidden'); sharePreview.textContent = j;
}

function handleImportToggle() { importCard.classList.toggle('hidden'); }

function handleImportConfirm() {
  const raw = importArea.value.trim();
  if (!raw) return showStatus('error', 'Paste JSON.');
  try {
    const d = JSON.parse(raw);
    if (!d.results) throw new Error('Invalid format.');
    addBaseline(d); importArea.value = ''; importCard.classList.add('hidden');
    showStatus('success', 'Imported!'); log(`Imported baseline: ${d.results.length} models.`);
  } catch (e) { showStatus('error', `Import failed: ${e.message}`); }
}

function handleExportSweep() {
  if (!lastSweepReport) return showStatus('error', 'Run sweep first.');
  try {
    const fn = `webllm-bench-sweep-${new Date().toISOString().replace(/[:.]/g, '')}.json`;
    const b = new Blob([JSON.stringify(lastSweepReport, null, 2) + '\n'], { type: 'application/json' });
    const u = URL.createObjectURL(b); const a = document.createElement('a');
    a.href = u; a.download = fn; a.style.display = 'none'; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 1200);
    showStatus('success', `Exported: ${fn}`);
  } catch (e) { showStatus('error', e.message); }
}

/* ══════════════════════════════════════════════════════════════════════
   TABS & EVENTS
   ══════════════════════════════════════════════════════════════════════ */

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// Use case cards
document.querySelectorAll('.usecase-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.usecase-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedUseCase = card.dataset.usecase;
    if (lastSweepReport) renderSweepResults(lastSweepReport, selectedUseCase);
  });
});

// Chat input: Enter to send
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
});

// Custom Models Handlers
function normalizeLocalRecordUrl(raw) {
  try {
    const u = new URL(raw);
    const isLoopback = u.hostname === '127.0.0.1' || u.hostname === 'localhost';
    const isProjectPath = u.pathname.includes('/local-model-host/') || u.pathname.includes('/jobtracker-mlc-lab-worktree/');
    if (isLoopback && isProjectPath) return `${window.location.origin}${u.pathname}${u.search || ''}`;
    return raw;
  } catch {
    return raw;
  }
}

async function readGeneratedLocalRecords() {
  const res = await fetch('./extension-lab/model_records.local.generated.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Cannot read local records (${res.status})`);
  return res.json();
}

async function handleAddBaseline8kPreset() {
  try {
    const data = await readGeneratedLocalRecords();
    const rec = data?.baseline8k;
    if (!rec?.model || !rec?.model_id || !rec?.model_lib) throw new Error('baseline8k record missing required fields');

    clearLocalModelFilesSelection();
    clearLocalWasmSelection();

    customModelUrl.value = normalizeLocalRecordUrl(rec.model);
    customLibUrl.value = normalizeLocalRecordUrl(rec.model_lib);
    customModelId.value = rec.model_id;
    customContext.value = String(rec?.overrides?.context_window_size || 8192);
    customVram.value = String(rec?.vram_required_MB || 2000);

    handleAddCustomModel();
  } catch (err) {
    customModelWarn.style.color = 'var(--yellow)';
    customModelWarn.textContent = `Preset load failed: ${err.message}`;
  }
}

function persistCustomModels() {
  const persistable = customModels.filter(m => !m.is_ephemeral_local_lib && !m.is_ephemeral_local_files);
  localStorage.setItem('webllm_custom_models', JSON.stringify(persistable));
}

function handleAddCustomModel() {
  const urlInput = customModelUrl.value.trim();
  const libInput = customLibUrl.value.trim();
  const mid = customModelId.value.trim();
  const ctx = parseInt(customContext.value, 10);
  const vrm = parseInt(customVram.value, 10);
  const useLocalFiles = selectedLocalModelFiles.length > 0 && !urlInput;
  const localValidation = useLocalFiles ? validateLocalModelFiles(selectedLocalModelFiles) : { missing: [], map: new Map() };

  let createdBlobUrl = '';
  let createdVirtualModelRoot = '';
  let createdLocalStore = false;
  customModelWarn.textContent = '';
  customModelWarn.style.color = 'var(--yellow)';
  
  if (!mid) {
    customModelWarn.textContent = 'Model ID is required.';
    return;
  }
  if (!urlInput && !useLocalFiles) {
    customModelWarn.textContent = 'Provide Model Weights URL or select local model files/folder.';
    return;
  }
  if (useLocalFiles && localValidation.missing.length) {
    customModelWarn.textContent = `Local files are incomplete: ${localValidation.missing.join(', ')}`;
    return;
  }
  if (urlInput && selectedLocalModelFiles.length > 0) {
    log('ℹ Model URL provided; local model files are ignored for this add.');
  }

  let modelRoot = urlInput;
  if (useLocalFiles) {
    createdVirtualModelRoot = `https://local.webllm/${encodeURIComponent(mid)}`;
    modelRoot = createdVirtualModelRoot;
    localModelStores.set(createdVirtualModelRoot, { modelId: mid, files: localValidation.map });
    createdLocalStore = true;
  }

  let lib = libInput;
  const useLocalWasm = !libInput && !!selectedLocalWasmFile;
  if (useLocalWasm) {
    createdBlobUrl = URL.createObjectURL(selectedLocalWasmFile);
    lib = createdBlobUrl;
  } else if (!libInput && useLocalFiles) {
    const wasmFile = Array.from(localValidation.map.values()).find(isWasmFile);
    if (wasmFile) {
      createdBlobUrl = URL.createObjectURL(wasmFile);
      lib = createdBlobUrl;
    }
  }
  if (!lib) {
    if (createdLocalStore) localModelStores.delete(createdVirtualModelRoot);
    customModelWarn.textContent = 'Model lib is required. Provide lib URL, local .wasm, or include .wasm in selected local files.';
    return;
  }
  
  // Create object with overriden data
  const record = {
    model: modelRoot,
    model_id: mid,
    model_lib: lib,
    overrides: { context_window_size: isNaN(ctx) ? 4096 : ctx, prefill_chunk_size: 1024 },
    vram_required_MB: isNaN(vrm) ? 2000 : vrm,
    is_custom: true,
    is_ephemeral_local_lib: useLocalWasm,
    is_ephemeral_local_files: useLocalFiles,
    local_wasm_name: useLocalWasm ? selectedLocalWasmFile.name : undefined,
    local_files_count: useLocalFiles ? selectedLocalModelFiles.length : undefined,
    local_virtual_root: useLocalFiles ? createdVirtualModelRoot : undefined,
  };

  if (allModels.some(m => m.model_id === mid)) {
    if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    if (createdLocalStore) localModelStores.delete(createdVirtualModelRoot);
    customModelWarn.textContent = `A model with ID "${mid}" is already in the registry.`;
    return;
  }

  customModels.push(record);
  
  try {
    persistCustomModels();
  } catch(e) {
    customModels = customModels.filter(m => m.model_id !== mid);
    if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    if (createdLocalStore) localModelStores.delete(createdVirtualModelRoot);
    customModelWarn.textContent = 'Failed to save to localStorage.';
    return;
  }

  rebuildModelRegistry();
  populateModelSelectors();
  
  customModelWarn.style.color = 'var(--green)';
  const sessionOnly = useLocalWasm || useLocalFiles;
  customModelWarn.textContent = sessionOnly
    ? `Added ${mid}. Local file assets are session-only and must be re-added after page reload.`
    : `Successfully added ${mid} to registry!`;
  
  // Clear inputs
  customModelUrl.value = ''; customLibUrl.value = ''; customModelId.value = ''; customContext.value = ''; customVram.value = '';
  clearLocalModelFilesSelection();
  clearLocalWasmSelection();
}

function handleClearCustomModels() {
  if (!confirm('Are you sure you want to remove all custom models?')) return;
  for (const m of customModels) {
    if ((m?.is_ephemeral_local_lib || m?.is_ephemeral_local_files) && typeof m.model_lib === 'string' && m.model_lib.startsWith('blob:')) {
      try { URL.revokeObjectURL(m.model_lib); } catch { /* noop */ }
    }
  }
  localModelStores.clear();
  customModels = [];
  localStorage.removeItem('webllm_custom_models');
  rebuildModelRegistry();
  populateModelSelectors();
  clearLocalModelFilesSelection();
  clearLocalWasmSelection();
  customModelWarn.style.color = 'var(--text-muted)';
  customModelWarn.textContent = 'Custom models cleared.';
}

// Events
runBtn.addEventListener('click', handleRun);
exportBtn.addEventListener('click', handleExport);
sweepBtn.addEventListener('click', handleSweep);
chatLoadBtn.addEventListener('click', handleChatLoad);
chatSendBtn.addEventListener('click', handleChatSend);
chatClearBtn.addEventListener('click', handleChatClear);
compareRunBtn.addEventListener('click', handleCompare);
shareBtn.addEventListener('click', handleShare);
importBtn.addEventListener('click', handleImportToggle);
importConfirmBtn.addEventListener('click', handleImportConfirm);
exportSweepBtn.addEventListener('click', handleExportSweep);
if (globalFamilyFilter) globalFamilyFilter.addEventListener('change', populateModelSelectors);

// Custom Models
if (addBaseline8kPresetBtn) addBaseline8kPresetBtn.addEventListener('click', handleAddBaseline8kPreset);
addCustomBtn.addEventListener('click', handleAddCustomModel);
clearCustomBtn.addEventListener('click', handleClearCustomModels);

/* ══════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════ */

async function init() {
  setupLocalModelFilesDropzone();
  setupLocalWasmDropzone();
  startAnalytics();
  if (!navigator.gpu) {
    showStatus('error', 'WebGPU not available. Use Chrome 113+ or Edge 113+.');
    runBtn.disabled = true; sweepBtn.disabled = true; chatLoadBtn.disabled = true; compareRunBtn.disabled = true;
    return;
  }
  await getDeviceInfo();
  loadSavedBaselines();

  // Pre-load WebLLM in background to populate model list
  try { await ensureWebLLM(); } catch (err) { log(`WebLLM pre-load note: ${err.message}`); }

  log('WebGPU detected. Ready.');
}

init();
