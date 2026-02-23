import { AnalyzedAct } from '../types';

// Mock data generator
const generateActs = (count: number): AnalyzedAct[] => {
  const acts: AnalyzedAct[] = [];
  for (let i = 0; i < count; i++) {
    acts.push({
      id: `act-${i}`,
      mesa: `Mesa ${Math.floor(Math.random() * 1000)}`,
      zona: `Zona ${Math.floor(Math.random() * 100)}`,
      votes: [],
      total_calculated: 0,
      total_declared: 0,
      is_legible: true,
      is_fraud: Math.random() < 0.1, // 10% fraud
      forensic_analysis: [],
      timestamp: new Date().toISOString(),
      isoTimestamp: new Date().toISOString(),
      status: 'completed'
    });
  }
  return acts;
};

const ACT_COUNT = 100000;
console.log(`Generating ${ACT_COUNT} mock acts...`);
const acts = generateActs(ACT_COUNT);

console.log('Starting benchmark for redundant filtering...');
const iterations = 1000;

// Baseline: Filtering twice
const startBaseline = performance.now();
for (let i = 0; i < iterations; i++) {
  const fraudActs = acts.filter(a => a.is_fraud).slice(0, 5);
  const fraudCount = acts.filter(a => a.is_fraud).length;
}
const endBaseline = performance.now();
const durationBaseline = endBaseline - startBaseline;

// Optimization: Filtering once
const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  const fraudActsAll = acts.filter(a => a.is_fraud);
  const fraudActs = fraudActsAll.slice(0, 5);
  const fraudCount = fraudActsAll.length;
}
const endOptimized = performance.now();
const durationOptimized = endOptimized - startOptimized;


console.log(`Baseline (Filter twice) duration: ${durationBaseline.toFixed(2)}ms`);
console.log(`Optimized (Filter once) duration: ${durationOptimized.toFixed(2)}ms`);
console.log(`Improvement: ${((durationBaseline - durationOptimized) / durationBaseline * 100).toFixed(2)}%`);
