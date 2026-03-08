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
    } as unknown as AnalyzedAct); // casting slightly if needed
  }
  return acts;
};

const ACT_COUNT = 50000;
console.log(`Generating ${ACT_COUNT} mock acts...`);
const acts = generateActs(ACT_COUNT);
const searchTerm = "Mesa 50";

const iterations = 100;

console.log('--- Original ---');
const startOriginal = performance.now();
for (let i = 0; i < iterations; i++) {
  const filteredActs = acts.filter(act =>
    act.mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.id.includes(searchTerm)
  );
}
const endOriginal = performance.now();
const originalAvg = (endOriginal - startOriginal) / iterations;
console.log(`Original average time per filter: ${originalAvg.toFixed(2)}ms`);

console.log('--- Optimized ---');
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
const optimizedAvg = (endOptimized - startOptimized) / iterations;
console.log(`Optimized average time per filter: ${optimizedAvg.toFixed(2)}ms`);

const improvement = ((originalAvg - optimizedAvg) / originalAvg) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);
