import { AnalyzedAct, ForensicDetail, VoteCount, StrategicAnalysis } from "../types";
import { POLITICAL_CONFIG } from "../constants";

interface AuditConfig {
  clientParty: string;
  rivalParties: string[];
  autoDetect: boolean;
}

export function runBusinessLogic(
  forensics: ForensicDetail[] = [],
  votes: VoteCount[],
  clientParty: string = POLITICAL_CONFIG.CLIENT_NAME,
  rivalParties: string[] = POLITICAL_CONFIG.RIVALS,
  autoDetect: boolean = true
): StrategicAnalysis {
  if (!forensics || forensics.length === 0) return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };

  let totalImpact = 0;
  let detectedIntent: 'BENEFICIO' | 'PERJUICIO' | 'NEUTRO' = 'NEUTRO';

  for (const f of forensics) {
    const delta = (f.final_value_legible || 0) - (f.original_value_inferred || 0);

    if (autoDetect) {
       if (delta < 0) {
           totalImpact -= Math.abs(delta);
           detectedIntent = 'PERJUICIO';
       } else if (delta > 0) {
           totalImpact += delta;
           if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO';
       }
    } else {
        if (f.affected_party === clientParty) {
          if (delta < 0) { totalImpact -= Math.abs(delta); detectedIntent = 'PERJUICIO'; }
          else { totalImpact += delta; if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
        } else if (rivalParties.includes(f.affected_party)) {
          if (delta > 0) { totalImpact -= delta; detectedIntent = 'PERJUICIO'; }
          else { totalImpact += Math.abs(delta); if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
        }
    }
  }

  if (detectedIntent === 'PERJUICIO') {
    return {
      intent: 'PERJUICIO',
      impact_score: totalImpact,
      recommendation: 'IMPUGNAR',
      legal_grounding: 'Alteración de resultados (Art. 192).'
    };
  }

  if (detectedIntent === 'BENEFICIO') {
    return {
      intent: 'BENEFICIO',
      impact_score: totalImpact,
      recommendation: 'RECONTEO',
      legal_grounding: 'Inconsistencia favorable detectada'
    };
  }

  return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };
}

const API_BASE_URL = '/api';

export const analyzeElectionAct = async (
  base64Image: string | null, 
  mimeType: string | null,
  fileName?: string,
  config?: AuditConfig,
  imageUrl?: string
): Promise<Partial<AnalyzedAct>> => {
  // Client-side PDF Size Check (Max 20MB)
  if (base64Image) {
    const sizeInBytes = (base64Image.length * 3) / 4;
    if (sizeInBytes > 20 * 1024 * 1024) {
      throw new Error("Archivo demasiado grande (Máx 20MB). Por favor comprime el PDF.");
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image,
        mimeType,
        imageUrl,
        fileName,
        config
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[GeminiServiceClient] Analysis failed:`, errorMessage);
    throw err;
  }
};
