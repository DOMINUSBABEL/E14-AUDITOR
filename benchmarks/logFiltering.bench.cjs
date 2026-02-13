
const { performance } = require('perf_hooks');

const logs = Array.from({ length: 1000 }).map((_, i) => ({
  id: i.toString(),
  timestamp: new Date().toISOString(),
  message: `Log message ${i}`,
  type: 'info',
  source: ['ClawdBot', 'Redis', 'GeminiWorker', 'LegalEngine'][i % 4]
}));

const selectedSource = 'ClawdBot';

function filterLogs(logs, selectedSource) {
  return selectedSource
    ? logs.filter(log => log.source === selectedSource)
    : logs;
}

// Simulated useMemo
let cachedLogs = null;
let lastLogs = null;
let lastSource = null;

function memoizedFilterLogs(logs, selectedSource) {
  if (logs === lastLogs && selectedSource === lastSource) {
    return cachedLogs;
  }
  lastLogs = logs;
  lastSource = selectedSource;
  cachedLogs = filterLogs(logs, selectedSource);
  return cachedLogs;
}

const iterations = 10000;

// Baseline (Unmemoized)
const startUnmemoized = performance.now();
for (let i = 0; i < iterations; i++) {
  filterLogs(logs, selectedSource);
}
const endUnmemoized = performance.now();

// Memoized (Inputs don't change)
const startMemoized = performance.now();
for (let i = 0; i < iterations; i++) {
  memoizedFilterLogs(logs, selectedSource);
}
const endMemoized = performance.now();

console.log(`Unmemoized: ${endUnmemoized - startUnmemoized}ms`);
console.log(`Memoized (no change): ${endMemoized - startMemoized}ms`);
console.log(`Improvement: ${((endUnmemoized - startUnmemoized) - (endMemoized - startMemoized)) / (endUnmemoized - startUnmemoized) * 100}%`);
