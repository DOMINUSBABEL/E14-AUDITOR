import { serve } from "bun";
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set");
  // Don't exit process in dev if possible, but for security it's better to fail fast.
  // process.exit(1);
  // Let's just log and fail requests
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });
const MODEL_NAME = 'gemini-2.5-flash-latest';

const server = serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight requests
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
      if (!API_KEY) {
          return new Response(JSON.stringify({ error: "Server misconfigured: GEMINI_API_KEY missing" }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
          });
      }
      try {
        const body = await req.json();
        const image = body.image;
        const mimeType = body.mimeType;

        if (!image || !mimeType) {
            return new Response(JSON.stringify({ error: "Missing image or mimeType" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

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
                  data: image
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
        if (!text) {
             return new Response(JSON.stringify({ error: "No response from Gemini" }), {
                 status: 500,
                 headers: { "Content-Type": "application/json" }
             });
        }

        return new Response(text, {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

      } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${server.port}`);
