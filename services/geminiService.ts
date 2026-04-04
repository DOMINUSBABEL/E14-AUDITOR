import { AnalyzedAct } from "../types";

interface AuditConfig {
  clientParty: string;
  rivalParties: string[];
  autoDetect: boolean;
}

const API_BASE_URL = '/api';

export const analyzeElectionAct = async (
  base64Image: string, 
  mimeType: string,
  fileName?: string,
  config?: AuditConfig
): Promise<Partial<AnalyzedAct>> => {
  // Client-side PDF Size Check (Max 20MB)
  const sizeInBytes = (base64Image.length * 3) / 4;
  if (sizeInBytes > 20 * 1024 * 1024) {
    throw new Error("Archivo demasiado grande (Máx 20MB). Por favor comprime el PDF.");
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
