import { AnalyzedAct } from '../types';

// Mock data generator
function generateActs(count: number, fraudProbability: number): AnalyzedAct[] {
  const acts: AnalyzedAct[] = [];
  for (let i = 0; i < count; i++) {
    acts.push({
      id: `act-${i}`,
      mesa: `mesa-${i}`,
      zona: `zona-${i % 10}`,
      votes: [],
      total_calculated: 100,
      total_declared: 100,
      is_legible: true,
      is_fraud: Math.random() < fraudProbability,
      forensic_analysis: [],
      timestamp: new Date().toISOString(),
      isoTimestamp: new Date().toISOString(),
      status: 'completed',
    });
  }
  return acts;
}

const actsCount = 100000;
const fraudRate = 0.05; // 5% fraud
const iterations = 1000;

console.log(`Generating ${actsCount} acts with ~${fraudRate * 100}% fraud...`);
const acts = generateActs(actsCount, fraudRate);

console.log('Starting benchmark...');

// Baseline (Current Implementation)
const startBaseline = performance.now();
for (let i = 0; i < iterations; i++) {
  // Logic from Dashboard.tsx
  const sliced = acts.filter(a => a.is_fraud).slice(0, 5);
  const isEmpty = acts.filter(a => a.is_fraud).length === 0;
}
const endBaseline = performance.now();
const baselineTime = endBaseline - startBaseline;

// Optimized Implementation
const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  // Logic we want to implement
  const fraudActs = acts.filter(a => a.is_fraud);
  const sliced = fraudActs.slice(0, 5);
  const isEmpty = fraudActs.length === 0;
}
const endOptimized = performance.now();
const optimizedTime = endOptimized - startOptimized;

console.log(`\nResults over ${iterations} iterations:`);
console.log(`Baseline: ${baselineTime.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);
