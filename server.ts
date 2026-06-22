import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import { POLITICAL_CONFIG, AI_CONFIG } from "./constants";
import { ForensicDetail, VoteCount, StrategicAnalysis, AnalyzedAct } from "./types";
import { runBusinessLogic } from "./services/geminiService";

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
    # TAREA: Auditar Formulario E-14 (Actas de Escrutinio de la Segunda Vuelta Presidencial de Colombia, 21 de junio de 2026).
    # OBJETIVO: Detectar tachones, enmendaduras y fraude aritmético.

    CANDIDATOS Y CATEGORÍAS DE LA SEGUNDA VUELTA:
    - Iván Cepeda Castro (Pacto Histórico)
    - Abelardo de la Espriella (Defensores de la Patria)
    - Voto en Blanco
    - Votos Nulos
    - Votos no Marcados

    INSTRUCCIONES:
    1. Analiza el E-14 (Imagen o PDF multipágina de la segunda vuelta presidencial).
    2. Extrae Mesa, Zona, Municipio.
    3. Extrae el conteo de votos exacto de cada una de las 5 categorías anteriores. Si el formulario contiene nombres abreviados o parciales, mapéalos de forma exacta a los nombres oficiales listados arriba en el arreglo 'votes'.
    4. Busca anomalías visuales en las casillas de votos (números repintados, tachones, enmendaduras, etc.).
    5. Si es un PDF multipágina, compara los ejemplares de Claveros, Delegados y Transmisión para hallar discrepancias.
    6. Responde SIEMPRE en JSON válido y asegúrate de que todos los partidos/candidatos en 'votes' coincidan exactamente con la lista de CANDIDATOS Y CATEGORÍAS.

    JSON SCHEMA:
    {
      "archivo_analizado": "string",
      "estado": "IMPUGNABLE" | "NO IMPUGNABLE" | "ERROR_DE_LECTURA",
      "hallazgos": ["string"],
      "nivel_de_confianza": "Alto" | "Medio" | "Bajo",
      "conclusion": "string",
      "mesa": "string",
      "zona": "string",
      "votes": [{"party": "Iván Cepeda Castro (Pacto Histórico)" | "Abelardo de la Espriella (Defensores de la Patria)" | "Voto en Blanco" | "Votos Nulos" | "Votos no Marcados", "count": number}],
      "total_calculated": number,
      "total_declared": number,
      "is_fraud": boolean,
      "forensic_analysis": [{"type": "TACHON"|"ENMENDADURA"|"NONE", "description": "string", "affected_party": "string", "original_value_inferred": number, "final_value_legible": number, "confidence": number}]
    }
  `;

  const provider = currentConfig.provider || getProvider();
  const model = currentConfig.model || AI_CONFIG.MODEL_NAME;
  const customApiKey = currentConfig.apiKeys?.[provider] || currentConfig.apiKey;

  let parsedData: any = null;

  try {
    if (provider === 'gemini') {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error("Falta la API Key de Gemini");
      const client = new GoogleGenAI({ apiKey });

      console.log(`[Backend] Analizando acta con Gemini Modelo ${model}...`);
      const response = await client.models.generateContent({
        model: model || 'gemini-2.5-flash-latest',
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
      if (!text) throw new Error("Respuesta vacía de Gemini");
      parsedData = JSON.parse(text);

    } else if (provider === 'claude') {
      const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Falta la API Key de Anthropic / Claude");

      console.log(`[Backend] Analizando acta con Claude Modelo ${model}...`);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Image } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en API de Anthropic: ${errorText}`);
      }

      const responseData = await response.json();
      const text = responseData.content?.[0]?.text || '';
      const cleanJsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      parsedData = JSON.parse(cleanJsonText);

    } else {
      // OpenAI / DeepSeek / Ollama / Gemma / OpenCode
      let baseURL = 'https://api.openai.com/v1';
      let apiKey = customApiKey || process.env.OPENAI_API_KEY;
      let modelName = model;

      if (provider === 'deepseek') {
        baseURL = 'https://api.deepseek.com/v1';
        apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
        modelName = model || 'deepseek-chat';
      } else if (provider === 'ollama' || provider === 'gemma' || provider === 'opencode') {
        baseURL = currentConfig.ollamaHost || process.env.VITE_OPENAI_BASE_URL || 'http://localhost:11434/v1';
        apiKey = 'ollama';
        modelName = model || (provider === 'gemma' ? 'gemma2' : 'qwen2-vl');
      }

      console.log(`[Backend] Analizando acta con ${provider} Modelo ${modelName}...`);
      const client = new OpenAI({ baseURL, apiKey });
      const response = await client.chat.completions.create({
        model: modelName,
        response_format: { type: 'json_object' },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }]
      });

      const text = response.choices[0].message.content || '{}';
      parsedData = JSON.parse(text);
    }

    if (parsedData.estado === "ERROR_DE_LECTURA") {
      throw new Error(parsedData.conclusion || "Documento ilegible. ERROR_DE_LECTURA");
    }

    const strategicAnalysis = runBusinessLogic(
      parsedData.forensic_analysis,
      parsedData.votes,
      currentConfig.clientParty,
      currentConfig.rivalParties ? Array.from(currentConfig.rivalParties) : POLITICAL_CONFIG.RIVALS,
      currentConfig.autoDetect !== false
    );

    return {
      ...parsedData,
      document_integrity: {
        estado: parsedData.estado,
        hallazgos: parsedData.hallazgos,
        nivel_de_confianza: parsedData.nivel_de_confianza,
        conclusion: parsedData.conclusion
      },
      strategic_analysis: strategicAnalysis,
      isoTimestamp: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString()
    };
  } catch (err: any) {
    console.error(`[Backend] Falló el proveedor ${provider}:`, err.message);
    throw err;
  }
};

if (import.meta.main) {
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
          const { base64Image, mimeType, imageUrl, fileName, config } = body;

          let finalBase64 = base64Image;
          let finalMime = mimeType;

          if (imageUrl && !finalBase64) {
            try {
              console.log(`[Backend] Descargando y convirtiendo acta E-14 desde CDN: ${imageUrl}`);
              const response = await fetch(imageUrl);
              if (!response.ok) throw new Error(`Fallo de conexión CDN: ${response.statusText}`);
              const buffer = await response.arrayBuffer();
              finalBase64 = Buffer.from(buffer).toString('base64');
              finalMime = response.headers.get('content-type') || 'image/jpeg';
            } catch (fetchErr: any) {
              return new Response(JSON.stringify({ error: `Error descargando imagen de Registraduría: ${fetchErr.message}` }), {
                status: 422,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              });
            }
          }

          if (!finalBase64 || !finalMime) {
            return new Response(JSON.stringify({ error: "Faltan campos obligatorios (base64Image o imageUrl)" }), {
              status: 400,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }

          const result = await analyzeElectionAct(finalBase64, finalMime, fileName || imageUrl, config);
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
}
