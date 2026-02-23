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
      is_fraud: false,
      forensic_analysis: [],
      timestamp: new Date().toISOString(),
      isoTimestamp: new Date().toISOString(),
      status: 'completed'
    });
  }
  return acts;
};

const ACT_COUNT = 50000;
console.log(`Generating ${ACT_COUNT} mock acts...`);
const acts = generateActs(ACT_COUNT);
const searchTerm = "Mesa 50";

console.log('Starting benchmark...');
const iterations = 100;

// Benchmark Current Implementation
const startCurrent = performance.now();
for (let i = 0; i < iterations; i++) {
  const filteredActs = acts.filter(act =>
    act.mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.id.includes(searchTerm)
  );
}
const endCurrent = performance.now();
const durationCurrent = endCurrent - startCurrent;
const avgCurrent = durationCurrent / iterations;

console.log(`Current Implementation: Total time for ${iterations} iterations: ${durationCurrent.toFixed(2)}ms`);
console.log(`Current Implementation: Average time per filter operation: ${avgCurrent.toFixed(2)}ms`);

// Benchmark Optimized Implementation
const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const filteredActs = acts.filter(act =>
    act.mesa.toLowerCase().includes(lowerSearchTerm) ||
    act.zona.toLowerCase().includes(lowerSearchTerm) ||
    act.id.includes(searchTerm)
  );
}
const endOptimized = performance.now();
const durationOptimized = endOptimized - startOptimized;
const avgOptimized = durationOptimized / iterations;

console.log(`Optimized Implementation: Total time for ${iterations} iterations: ${durationOptimized.toFixed(2)}ms`);
console.log(`Optimized Implementation: Average time per filter operation: ${avgOptimized.toFixed(2)}ms`);

const improvement = ((avgCurrent - avgOptimized) / avgCurrent) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
