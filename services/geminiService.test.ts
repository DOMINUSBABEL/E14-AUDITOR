import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
import { ForensicDetail, VoteCount } from "../types";
import { POLITICAL_CONFIG } from "../constants";

let mockGenerateContentResponse = Promise.resolve({ text: "{}" });

// Mock GoogleGenAI to prevent initialization errors during import
// This needs to happen before importing the service
mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContent: () => mockGenerateContentResponse
      }
    },
    Type: {
      OBJECT: "OBJECT",
      STRING: "STRING",
      ARRAY: "ARRAY",
      INTEGER: "INTEGER",
      BOOLEAN: "BOOLEAN",
      NUMBER: "NUMBER"
    }
  };
});

export const setMockGenerateContentResponse = (response: any) => {
    mockGenerateContentResponse = response;
};

describe("geminiService", () => {
  let runBusinessLogic: any;
  let analyzeElectionAct: any;
  const originalEthics = POLITICAL_CONFIG.STRICT_ETHICS;

  beforeAll(async () => {
      const module = await import("./geminiService");
      runBusinessLogic = module.runBusinessLogic;
      analyzeElectionAct = module.analyzeElectionAct;
  });

  afterAll(() => {
    (POLITICAL_CONFIG as any).STRICT_ETHICS = originalEthics;
  });

  describe("analyzeElectionAct", () => {
    it("should successfully process a valid response from Gemini", async () => {
        const mockResponse = {
            mesa: "Mesa 1",
            zona: "Zona A",
            votes: [{ party: POLITICAL_CONFIG.CLIENT_NAME, count: 100 }],
            total_calculated: 100,
            total_declared: 100,
            is_fraud: false,
            forensic_analysis: []
        };

        setMockGenerateContentResponse(Promise.resolve({ text: JSON.stringify(mockResponse) }));

        const result = await analyzeElectionAct("base64data", "image/jpeg");

        expect(result.mesa).toBe("Mesa 1");
        expect(result.zona).toBe("Zona A");
        expect(result.votes).toEqual(mockResponse.votes);
        expect(result.strategic_analysis.intent).toBe("NEUTRO");
    });

    it("should handle scenarios where Gemini response text is empty", async () => {
        setMockGenerateContentResponse(Promise.resolve({ text: "" }));

        expect(analyzeElectionAct("base64data", "image/jpeg")).rejects.toThrow("No response from Gemini");
    });

    it("should handle scenarios where Gemini response contains invalid JSON", async () => {
        setMockGenerateContentResponse(Promise.resolve({ text: "invalid json string" }));

        expect(analyzeElectionAct("base64data", "image/jpeg")).rejects.toThrow("Failed to parse Gemini response");
    });

    it("should apply business logic based on forensic analysis correctly", async () => {
        const mockResponse = {
            mesa: "Mesa 2",
            zona: "Zona B",
            votes: [],
            total_calculated: 0,
            total_declared: 0,
            is_fraud: true,
            forensic_analysis: [{
                type: "TACHON",
                description: "Votes removed",
                affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                original_value_inferred: 50,
                final_value_legible: 40,
                confidence: 0.9
            }]
        };

        setMockGenerateContentResponse(Promise.resolve({ text: JSON.stringify(mockResponse) }));

        const result = await analyzeElectionAct("base64data", "image/jpeg");

        expect(result.strategic_analysis.intent).toBe("PERJUICIO");
        expect(result.strategic_analysis.recommendation).toBe("IMPUGNAR");
    });
  });

  describe("runBusinessLogic", () => {
    it("should handle empty forensics and votes", () => {
      const result = runBusinessLogic([], []);
      expect(result).toEqual({
        intent: 'NEUTRO',
        impact_score: 0,
        recommendation: 'VALIDAR'
      });
    });

    it("should accept valid VoteCount array", () => {
        const votes: VoteCount[] = [
            { party: "Party A", count: 100 },
            { party: "Party B", count: 50 }
        ];
        // We are passing votes to ensure the type check passes
        const result = runBusinessLogic([], votes);
        expect(result).toEqual({
            intent: 'NEUTRO',
            impact_score: 0,
            recommendation: 'VALIDAR'
        });
    });

    describe("PERJUICIO scenarios", () => {
        it("should detect PERJUICIO when client votes are removed", () => {
             const forensics: ForensicDetail[] = [{
                type: "TACHON",
                description: "Votes removed",
                affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                original_value_inferred: 50,
                final_value_legible: 40, // -10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics, []);
            expect(result).toEqual({
                intent: 'PERJUICIO',
                impact_score: -10,
                recommendation: 'IMPUGNAR',
                legal_grounding: expect.stringContaining("Alteración de resultados electorales")
            });
        });

        it("should detect PERJUICIO when rival votes are artificially added", () => {
             const rival = POLITICAL_CONFIG.RIVALS[0];
             const forensics: ForensicDetail[] = [{
                type: "ENMENDADURA",
                description: "Votes added to rival",
                affected_party: rival,
                original_value_inferred: 10,
                final_value_legible: 20, // +10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics, []);
            expect(result).toEqual({
                intent: 'PERJUICIO',
                impact_score: -10,
                recommendation: 'IMPUGNAR',
                legal_grounding: expect.stringContaining("Alteración de resultados electorales")
            });
        });
    });

    describe("BENEFICIO scenarios", () => {
        it("should detect BENEFICIO (RECONTEO) when client votes are added, regardless of STRICT_ETHICS", () => {
            // STRICT_ETHICS logic was removed, so this should return RECONTEO
            (POLITICAL_CONFIG as any).STRICT_ETHICS = false;
             const forensics: ForensicDetail[] = [{
                type: "ENMENDADURA",
                description: "Votes added to client",
                affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                original_value_inferred: 40,
                final_value_legible: 50, // +10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics, []);
            expect(result).toEqual({
                intent: 'BENEFICIO',
                impact_score: 10,
                recommendation: 'RECONTEO',
                legal_grounding: expect.stringContaining("Inconsistencia favorable")
            });
        });

        it("should detect BENEFICIO (RECONTEO) when rival votes are removed, regardless of STRICT_ETHICS", () => {
            // STRICT_ETHICS logic was removed, so this should return RECONTEO
            (POLITICAL_CONFIG as any).STRICT_ETHICS = false;
             const rival = POLITICAL_CONFIG.RIVALS[0];
             const forensics: ForensicDetail[] = [{
                type: "TACHON",
                description: "Votes removed from rival",
                affected_party: rival,
                original_value_inferred: 20,
                final_value_legible: 10, // -10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics, []);
            expect(result).toEqual({
                intent: 'BENEFICIO',
                impact_score: 10,
                recommendation: 'RECONTEO',
                legal_grounding: expect.stringContaining("Inconsistencia favorable")
            });
        });
    });

    describe("Mixed scenarios", () => {
        it("should prioritize PERJUICIO over BENEFICIO", () => {
             const rival = POLITICAL_CONFIG.RIVALS[0];
             const forensics: ForensicDetail[] = [
                {
                    // Benefit: Client gets +10
                    type: "ENMENDADURA",
                    description: "Gain",
                    affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                    original_value_inferred: 40,
                    final_value_legible: 50,
                    confidence: 0.9
                },
                {
                    // Prejudice: Rival gets +100
                    type: "ENMENDADURA",
                    description: "Loss",
                    affected_party: rival,
                    original_value_inferred: 100,
                    final_value_legible: 200,
                    confidence: 0.9
                }
            ];

            const result = runBusinessLogic(forensics, []);
            expect(result).toEqual({
                intent: 'PERJUICIO',
                impact_score: -90, // +10 - 100 = -90
                recommendation: 'IMPUGNAR',
                legal_grounding: expect.stringContaining("Alteración de resultados electorales")
            });
        });
    });
  });
});
