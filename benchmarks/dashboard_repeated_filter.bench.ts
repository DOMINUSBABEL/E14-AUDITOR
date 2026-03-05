import { AnalyzedAct } from '../types';

const generateActs = (count: number): AnalyzedAct[] => {
  const acts: AnalyzedAct[] = [];
  for (let i = 0; i < count; i++) {
    acts.push({
      id: `act-${i}`,
      mesa: `Mesa ${i}`,
      zona: `Zona ${Math.floor(i / 100)}`,
      votes: [],
      total_calculated: 100,
      total_declared: 100,
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
const acts = generateActs(ACT_COUNT);

function unoptimized() {
  const result1 = acts.filter(a => a.is_fraud).slice(0, 5);
  const result2 = acts.filter(a => a.is_fraud).length === 0;
  return [result1, result2];
}

function optimized() {
  const fraudActs = acts.filter(a => a.is_fraud);
  const result1 = fraudActs.slice(0, 5);
  const result2 = fraudActs.length === 0;
  return [result1, result2];
}

const iterations = 1000;

console.log(`Running benchmark with ${ACT_COUNT} acts and ${iterations} iterations...`);

// Warmup
for (let i = 0; i < 100; i++) {
  unoptimized();
  optimized();
}

const startUnoptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  unoptimized();
}
const endUnoptimized = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  optimized();
}
const endOptimized = performance.now();

console.log(`Unoptimized: ${(endUnoptimized - startUnoptimized).toFixed(2)}ms`);
console.log(`Optimized:   ${(endOptimized - startOptimized).toFixed(2)}ms`);
console.log(`Improvement: ${(((endUnoptimized - startUnoptimized) - (endOptimized - startOptimized)) / (endUnoptimized - startUnoptimized) * 100).toFixed(2)}%`);
