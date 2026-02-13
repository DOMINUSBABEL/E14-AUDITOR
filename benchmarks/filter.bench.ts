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
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  const filteredActs = acts.filter(act =>
    act.mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    act.id.includes(searchTerm)
  );
}

const end = performance.now();
const duration = end - start;
const avg = duration / iterations;

console.log(`Total time for ${iterations} iterations: ${duration.toFixed(2)}ms`);
console.log(`Average time per filter operation: ${avg.toFixed(2)}ms`);
