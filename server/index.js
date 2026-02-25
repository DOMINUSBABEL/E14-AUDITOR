import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env.local if exists, otherwise .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const MODEL_NAME = 'gemini-2.5-flash-latest';

app.post('/api/analyze', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key not found");
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const ai = new GoogleGenAI({ apiKey });

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
    res.json(data);

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
