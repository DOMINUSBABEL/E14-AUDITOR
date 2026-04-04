import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { POLITICAL_CONFIG, AI_CONFIG } from "./constants";
import { ForensicDetail, VoteCount, StrategicAnalysis, AnalyzedAct } from "./types";

const getProvider = () => process.env.VITE_AI_PROVIDER || 'gemini';

let aiGemini: GoogleGenAI | null = null;
let aiOpenAI: OpenAI | null = null;

const getGeminiClient = () => {
  if (aiGemini) return aiGemini;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API Key in server environment");
  aiGemini = new GoogleGenAI({ apiKey });
  return aiGemini;
};

const getOpenAIClient = () => {
  if (aiOpenAI) return aiOpenAI;
  const baseURL = process.env.VITE_OPENAI_BASE_URL || 'http://localhost:11434/v1';
  const apiKey = process.env.VITE_OPENAI_API_KEY || 'ollama';
  aiOpenAI = new OpenAI({ baseURL, apiKey });
  return aiOpenAI;
}

const MODELS = [AI_CONFIG.MODEL_NAME];

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

export const analyzeElectionAct = async (
  base64Image: string,
  mimeType: string,
  fileName?: string,
  config?: AuditConfig
): Promise<Partial<AnalyzedAct>> => {
  const currentConfig = config || {
    clientParty: POLITICAL_CONFIG.CLIENT_NAME,
    rivalParties: POLITICAL_CONFIG.RIVALS,
    autoDetect: true
  };

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
        console.log(`[Backend] Attempting analysis with ${modelName}...`);
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

        let data = JSON.parse(text);

        if (data.estado === "ERROR_DE_LECTURA") {
            throw new Error(data.conclusion || "Documento ilegible. ERROR_DE_LECTURA");
        }

        const strategicAnalysis = runBusinessLogic(
          data.forensic_analysis,
          data.votes,
          currentConfig.clientParty,
          currentConfig.rivalParties,
          currentConfig.autoDetect
        );

        return {
          ...data,
          document_integrity: {
            estado: data.estado,
            hallazgos: data.hallazgos,
            nivel_de_confianza: data.nivel_de_confianza,
            conclusion: data.conclusion
          },
          strategic_analysis: strategicAnalysis,
          isoTimestamp: new Date().toISOString(),
          timestamp: new Date().toLocaleTimeString()
        };
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`[Backend] Model ${modelName} failed:`, errorMessage);
        lastError = err;
      }
    }
    const finalErrorMessage = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(finalErrorMessage || "All models failed to process document.");
  } else {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: process.env.VITE_OPENAI_MODEL || 'qwen2-vl',
      response_format: { type: 'json_object' },
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }] }]
    });
    const data = JSON.parse(response.choices[0].message.content || '{}');

    if (data.estado === "ERROR_DE_LECTURA") {
        throw new Error(data.conclusion || "Documento ilegible. ERROR_DE_LECTURA");
    }

    return {
      ...data,
      document_integrity: {
        estado: data.estado,
        hallazgos: data.hallazgos,
        nivel_de_confianza: data.nivel_de_confianza,
        conclusion: data.conclusion
      },
      strategic_analysis: runBusinessLogic(
          data.forensic_analysis,
          data.votes,
          currentConfig.clientParty,
          currentConfig.rivalParties,
          currentConfig.autoDetect
      )
    };
  }
};

const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/analyze" && req.method === "POST") {
      try {
        const body = await req.json();
        const { base64Image, mimeType, fileName, config } = body;

        if (!base64Image || !mimeType) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const result = await analyzeElectionAct(base64Image, mimeType, fileName, config);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Analysis error:", error);
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Backend server running at http://localhost:${server.port}`);
