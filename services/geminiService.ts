import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedAct } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const analyzeElectionAct = async (
  base64Image: string, 
  mimeType: string
): Promise<Partial<AnalyzedAct>> => {
  try {
    const prompt = `
      Actúa como auditor electoral experto. Analiza esta imagen del Acta E-14.
      1. Extrae el número de MESA y ZONA (si es visible, sino inventa un placeholder lógico basado en contexto).
      2. Extrae la lista de VOTOS por partido/candidato visibles.
      3. Suma los votos extraídos y verifica si coincide con el "Total Votos" escrito en el formato.
      4. Retorna JSON estricto.
      
      Si la imagen no parece un acta, indica error en el JSON.
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
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
      mesa: data.mesa || "UNKNOWN",
      zona: data.zona || "UNKNOWN",
      votes: data.votes || [],
      total_calculated: data.total_calculated || 0,
      total_declared: data.total_declared || 0,
      is_fraud: data.is_fraud || false,
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};