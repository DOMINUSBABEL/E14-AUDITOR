
import { AnalyzedAct, ForensicDetail, StrategicAnalysis } from '../types';
import { generateCSVChunks } from '../components/DataLake.utils';

function generateMockActs(count: number): AnalyzedAct[] {
  const acts: AnalyzedAct[] = [];
  for (let i = 0; i < count; i++) {
    const forensicAnalysis: ForensicDetail[] = i % 5 === 0 ? [{
      type: 'TACHON',
      description: 'Ink smear over total',
      affected_party: 'Party A',
      original_value_inferred: 100,
      final_value_legible: 120,
      confidence: 0.95
    }] : [];

    const strategicAnalysis: StrategicAnalysis | undefined = i % 3 === 0 ? {
      intent: 'BENEFICIO',
      impact_score: 20,
      recommendation: 'IMPUGNAR',
      legal_grounding: 'Art 123'
    } : undefined;

    acts.push({
      id: `act-${i}`,
      mesa: `Mesa ${i}`,
      zona: `Zona ${Math.floor(i / 100)}`,
      votes: [],
      total_calculated: 100 + (i % 50),
      total_declared: 100 + (i % 50) + (i % 5 === 0 ? 20 : 0),
      is_legible: true,
      is_fraud: i % 10 === 0,
      forensic_analysis: forensicAnalysis,
      strategic_analysis: strategicAnalysis,
      timestamp: new Date().toISOString(),
      isoTimestamp: new Date().toISOString(),
      status: 'completed'
    });
  }
  return acts;
}

const acts = generateMockActs(200000); // 200k rows
const selectedColumns = [
  'id', 'mesa', 'zona', 'total_calculated', 'total_declared',
  'is_fraud', 'timestamp', 'strategic_intent',
  'strategic_recommendation', 'forensic_summary'
];

console.log(`Benchmarking export with ${acts.length} records...`);

// Baseline implementation
function baselineExport(dataToExport: AnalyzedAct[], columns: string[]) {
    const headers = columns.join(',');
    const rows = dataToExport.map(act => {
      return columns.map(col => {
        let val: any = '';
        if (col in act) {
            // @ts-ignore
            val = act[col];
        }
        else if (col === 'strategic_intent') {
            val = act.strategic_analysis?.intent || 'N/A';
        }
        else if (col === 'strategic_recommendation') {
            val = act.strategic_analysis?.recommendation || 'N/A';
        }
        else if (col === 'forensic_summary') {
            val = act.forensic_analysis.map(f => `${f.type} (${f.affected_party})`).join('; ') || 'None';
        }

        if (typeof val === 'string') {
            val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    return encodedUri;
}

function runBenchmark(name: string, fn: Function, acts: AnalyzedAct[], cols: string[]) {
    const start = performance.now();
    const res = fn(acts, cols);
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    return end - start;
}

const t1 = runBenchmark('Baseline', baselineExport, acts, selectedColumns);
const t2 = runBenchmark('Optimized (Production Utils)', generateCSVChunks, acts, selectedColumns);

console.log(`Improvement: ${(t1 / t2).toFixed(2)}x`);
