import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedAct, ForensicDetail, StrategicAnalysis } from "../types";
import { POLITICAL_CONFIG } from "../constants";

// Initialize Gemini Client
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-latest'; // Using Flash for speed/vision

export const analyzeElectionAct = async (
  base64Image: string, 
  mimeType: string
): Promise<Partial<AnalyzedAct>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'dummy_key' });
    const prompt = `
      Actúa como un Auditor Forense Electoral Experto (Nivel CNE Colombia). Analiza esta imagen del formulario E-14.
      
      TU MISIÓN:
      1. OCR Básico: Extrae Mesa, Zona y Votos por partido.
      2. ANÁLISIS FORENSE VISUAL (CRÍTICO):
         - Busca "Tachones" (zonas oscurecidas/reescritas).
         - Busca "Enmendaduras" (números convertidos, ej: un 3 vuelto un 8).
         - Busca diferencias de tinta o caligrafía.
      3. TRAZABILIDAD (Pre/Post):
         - Si hay una alteración, intenta inferir el número ORIGINAL (antes) y el FINAL (después).
      
      Retorna un objeto JSON con la estructura exacta definida.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mesa: { type: Type.STRING },
            zona: { type: Type.STRING },
            votes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  party: { type: Type.STRING },
                  count: { type: Type.INTEGER }
                }
              }
            },
            total_calculated: { type: Type.INTEGER },
            total_declared: { type: Type.INTEGER },
            is_fraud: { type: Type.BOOLEAN },
            forensic_analysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["TACHON", "ENMENDADURA", "CALIGRAFIA", "NONE"] },
                  description: { type: Type.STRING },
                  affected_party: { type: Type.STRING },
                  original_value_inferred: { type: Type.INTEGER, nullable: true },
                  final_value_legible: { type: Type.INTEGER },
                  confidence: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

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
function runBusinessLogic(forensics: ForensicDetail[] = [], votes: any[]): StrategicAnalysis {
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