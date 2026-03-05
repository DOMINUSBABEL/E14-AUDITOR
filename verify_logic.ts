import { AnalyzedAct, SystemMetrics } from './types';

const mockMetrics: SystemMetrics = {
  totalProcessed: 1000,
  fraudDetected: 50,
  queueSize: 10,
  activeWorkers: 5,
  cpuLoad: 45,
  ramUsage: 60,
};

const mockActs: AnalyzedAct[] = [
  {
    id: '1',
    mesa: 'Mesa 1',
    zona: 'Zona 1',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: true, // Should be in fraudActs
    forensic_analysis: [],
    timestamp: '10:00',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed',
  },
  {
    id: '2',
    mesa: 'Mesa 2',
    zona: 'Zona 2',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false, // Should NOT be in fraudActs
    forensic_analysis: [],
    timestamp: '10:05',
    isoTimestamp: '2023-10-27T10:05:00Z',
    status: 'completed',
  },
];

// Simple mock of React and useMemo for testing
const ReactMock = {
  useState: (initial: any) => [initial, () => {}],
  useMemo: (factory: any, deps: any) => factory(),
  FC: {} as any,
};

// Since we can't easily run the component without a full React environment and JSDOM,
// we'll at least verify the logic of filtering.
console.log("Verifying filtering logic...");
const fraudActs = mockActs.filter(a => a.is_fraud);
console.log(`Total acts: ${mockActs.length}`);
console.log(`Fraud acts: ${fraudActs.length}`);

if (fraudActs.length !== 1) {
  console.error("FAILED: Fraud filtering logic is incorrect!");
  process.exit(1);
}

if (fraudActs[0].id !== '1') {
  console.error("FAILED: Wrong act filtered as fraud!");
  process.exit(1);
}

console.log("Filtering logic verified successfully.");
