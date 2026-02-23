import { AnalyzedAct, ForensicDetail, StrategicAnalysis, VoteCount } from "../types";
import { POLITICAL_CONFIG } from "../constants";

// Removed GoogleGenAI import and client-side initialization

export const analyzeElectionAct = async (
  base64Image: string, 
  mimeType: string
): Promise<Partial<AnalyzedAct>> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // --- BUSINESS LOGIC ENGINE (CLIENT SIDE) ---
    // Classify Intent and Generate Recommendation locally to ensure client-specific logic control
    const strategicAnalysis = runBusinessLogic(data.forensic_analysis, data.votes);

    return {
      mesa: data.mesa || "UNKNOWN",
      zona: data.zona || "UNKNOWN",
      votes: data.votes || [],
      total_calculated: data.total_calculated || 0,
      total_declared: data.total_declared || 0,
      is_fraud: data.is_fraud || false,
      forensic_analysis: data.forensic_analysis || [],
      strategic_analysis: strategicAnalysis
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

// Internal Logic: Determine if alteration helps or hurts the Client
export function runBusinessLogic(forensics: ForensicDetail[] = [], votes: VoteCount[]): StrategicAnalysis {
  const client = POLITICAL_CONFIG.CLIENT_NAME;
  
  if (!forensics || forensics.length === 0) {
    return {
      intent: 'NEUTRO',
      impact_score: 0,
      recommendation: 'VALIDAR'
    };
  }

  let totalImpact = 0;
  let isSevere = false;
  let detectedIntent: 'BENEFICIO' | 'PERJUICIO' | 'NEUTRO' = 'NEUTRO';

  for (const f of forensics) {
    const delta = (f.final_value_legible || 0) - (f.original_value_inferred || 0);
    
    // Case 1: Client votes modified
    if (f.affected_party === client) {
      if (delta < 0) {
         // Votes removed from client
         totalImpact -= Math.abs(delta);
         detectedIntent = 'PERJUICIO';
      } else {
         // Votes added to client
         totalImpact += delta;
         if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO';
      }
    } 
    // Case 2: Rival votes modified
    else if (POLITICAL_CONFIG.RIVALS.includes(f.affected_party)) {
      if (delta > 0) {
        // Rival artificially gained votes -> Prejudice to us
        totalImpact -= delta; 
        detectedIntent = 'PERJUICIO';
      } else {
        // Rival lost votes -> Benefit to us
        totalImpact += Math.abs(delta);
        if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO';
      }
    }
  }

  // Recommendation Engine
  if (detectedIntent === 'PERJUICIO') {
    return {
      intent: 'PERJUICIO',
      impact_score: totalImpact,
      recommendation: 'IMPUGNAR',
      legal_grounding: 'Alteración de resultados electorales (Art. 192 Código Electoral). Discrepancia aritmética inducida.'
    };
  } else if (detectedIntent === 'BENEFICIO') {
     // If strict ethics is OFF, we silent log beneficial errors
     return {
       intent: 'BENEFICIO',
       impact_score: totalImpact,
       recommendation: POLITICAL_CONFIG.STRICT_ETHICS ? 'RECONTEO' : 'SILENT_LOG',
       legal_grounding: 'Inconsistencia favorable detectada.'
     };
  }

  return {
    intent: 'NEUTRO',
    impact_score: 0,
    recommendation: 'VALIDAR'
  };
}
