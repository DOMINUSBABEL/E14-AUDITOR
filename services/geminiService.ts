import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { AnalyzedAct, ForensicDetail, StrategicAnalysis, VoteCount } from "../types";
import { POLITICAL_CONFIG } from "../constants";

let aiGemini: GoogleGenAI | null = null;
let aiOpenAI: OpenAI | null = null;

const getProvider = () => process.env.VITE_AI_PROVIDER || 'gemini';

const getGeminiClient = () => {
  if (aiGemini) return aiGemini;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key in .env");
  aiGemini = new GoogleGenAI({ apiKey });
  return aiGemini;
};

const getOpenAIClient = () => {
  if (aiOpenAI) return aiOpenAI;
  const baseURL = process.env.VITE_OPENAI_BASE_URL || 'http://localhost:11434/v1';
  const apiKey = process.env.VITE_OPENAI_API_KEY || 'ollama';
  aiOpenAI = new OpenAI({ baseURL, apiKey, dangerouslyAllowBrowser: true });
  return aiOpenAI;
}

// Exclusive Flagship Model: 3.1 Pro (Highest quality for forensic analysis)
const MODELS = ['gemini-3.1-pro-preview'];

export const analyzeElectionAct = async (
  base64Image: string, 
  mimeType: string,
  fileName?: string
): Promise<Partial<AnalyzedAct>> => {
  
  // PDF Size Check (Max 20MB for inlineData)
  const sizeInBytes = (base64Image.length * 3) / 4;
  if (sizeInBytes > 20 * 1024 * 1024) {
    throw new Error("Archivo demasiado grande (Máx 20MB). Por favor comprime el PDF.");
  }

  const prompt = `
    # ROL: Experto Analista Forense Electoral (Registraduría Colombia)
    # TAREA: Auditar Formulario E-14 (Actas de Escrutinio).
    # OBJETIVO: Detectar tachones, enmendaduras y fraude aritmético.
    
    INSTRUCCIONES:
    1. Analiza el E-14 (Imagen o PDF multipágina).
    2. Extrae Mesa, Zona, Municipio.
    3. Extrae conteo de votos de cada partido.
    4. Busca anomalías visuales en las casillas de votos.
    5. Si es un PDF multipágina, compara Claveros con Delegados.
    6. Responde SIEMPRE en JSON válido.

    JSON SCHEMA:
    {
      "archivo_analizado": "string",
      "estado": "IMPUGNABLE" | "NO IMPUGNABLE" | "ERROR_DE_LECTURA",
      "hallazgos": ["string"],
      "nivel_de_confianza": "Alto" | "Medio" | "Bajo",
      "conclusion": "string",
      "mesa": "string",
      "zona": "string",
      "votes": [{"party": "string", "count": number}],
      "total_calculated": number,
      "total_declared": number,
      "is_fraud": boolean,
      "forensic_analysis": [{"type": "TACHON"|"ENMENDADURA"|"NONE", "description": "string", "affected_party": "string", "original_value_inferred": number, "final_value_legible": number, "confidence": number}]
    }
  `;

  if (getProvider() === 'gemini') {
    const client = getGeminiClient();
    let lastError = null;

    for (const modelName of MODELS) {
      try {
        console.log(`[GeminiService] Attempting analysis with ${modelName}...`);
        const response = await client.models.generateContent({
          model: modelName,
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Image } },
              { text: prompt }
            ]
          }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                archivo_analizado: { type: Type.STRING },
                estado: { type: Type.STRING, enum: ["IMPUGNABLE", "NO IMPUGNABLE", "ERROR_DE_LECTURA"] },
                hallazgos: { type: Type.ARRAY, items: { type: Type.STRING } },
                nivel_de_confianza: { type: Type.STRING, enum: ["Alto", "Medio", "Bajo"] },
                conclusion: { type: Type.STRING },
                mesa: { type: Type.STRING },
                zona: { type: Type.STRING },
                votes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { party: { type: Type.STRING }, count: { type: Type.INTEGER } } } },
                total_calculated: { type: Type.INTEGER },
                total_declared: { type: Type.INTEGER },
                is_fraud: { type: Type.BOOLEAN },
                forensic_analysis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, description: { type: Type.STRING }, affected_party: { type: Type.STRING }, original_value_inferred: { type: Type.INTEGER, nullable: true }, final_value_legible: { type: Type.INTEGER }, confidence: { type: Type.NUMBER } } } }
              }
            }
          }
        });

        const text = response.text;
        if (!text) continue;
        
        const data = JSON.parse(text);
        const strategicAnalysis = runBusinessLogic(data.forensic_analysis, data.votes);

        return {
          ...data,
          strategic_analysis: strategicAnalysis,
          isoTimestamp: new Date().toISOString(),
          timestamp: new Date().toLocaleTimeString()
        };
      } catch (err: any) {
        console.warn(`[GeminiService] Model ${modelName} failed:`, err.message);
        lastError = err;
        // Continue to next model in fallback chain
      }
    }
    throw new Error(lastError?.message || "All models failed to process document.");
  } else {
    // OpenAI Fallback Logic (simplified)
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: process.env.VITE_OPENAI_MODEL || 'qwen2-vl',
      response_format: { type: 'json_object' },
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }] }]
    });
    const data = JSON.parse(response.choices[0].message.content || '{}');
    return { ...data, strategic_analysis: runBusinessLogic(data.forensic_analysis, data.votes) };
  }
};

export function runBusinessLogic(forensics: ForensicDetail[] = [], votes: VoteCount[]): StrategicAnalysis {
  const client = POLITICAL_CONFIG.CLIENT_NAME;
  if (!forensics || forensics.length === 0) return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };

  let totalImpact = 0;
  let detectedIntent: 'BENEFICIO' | 'PERJUICIO' | 'NEUTRO' = 'NEUTRO';

  for (const f of forensics) {
    const delta = (f.final_value_legible || 0) - (f.original_value_inferred || 0);
    if (f.affected_party === client) {
      if (delta < 0) { totalImpact -= Math.abs(delta); detectedIntent = 'PERJUICIO'; }
      else { totalImpact += delta; if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
    } else if (POLITICAL_CONFIG.RIVALS.includes(f.affected_party)) {
      if (delta > 0) { totalImpact -= delta; detectedIntent = 'PERJUICIO'; }
      else { totalImpact += Math.abs(delta); if (detectedIntent !== 'PERJUICIO') detectedIntent = 'BENEFICIO'; }
    }
  }

  if (detectedIntent === 'PERJUICIO') return { intent: 'PERJUICIO', impact_score: totalImpact, recommendation: 'IMPUGNAR', legal_grounding: 'Alteración de resultados (Art. 192).' };
  if (detectedIntent === 'BENEFICIO') return { intent: 'BENEFICIO', impact_score: totalImpact, recommendation: 'RECONTEO', legal_grounding: 'Inconsistencia favorable.' };
  return { intent: 'NEUTRO', impact_score: 0, recommendation: 'VALIDAR' };
}
