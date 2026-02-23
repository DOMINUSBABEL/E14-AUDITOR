import { describe, it, expect, mock, beforeAll, afterAll } from "bun:test";
import { ForensicDetail, VoteCount } from "../types";
import { POLITICAL_CONFIG } from "../constants";

// Mock GoogleGenAI to prevent initialization errors during import
// This needs to happen before importing the service
mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor() {}
      models = {
        generateContent: () => Promise.resolve({ text: "{}" })
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

describe("geminiService", () => {
  let runBusinessLogic: any;
  const originalEthics = POLITICAL_CONFIG.STRICT_ETHICS;

  beforeAll(async () => {
      const module = await import("./geminiService");
      runBusinessLogic = module.runBusinessLogic;
  });

  afterAll(() => {
    (POLITICAL_CONFIG as any).STRICT_ETHICS = originalEthics;
  });

  describe("runBusinessLogic", () => {
    it("should handle empty forensics", () => {
      const result = runBusinessLogic([]);
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
            const result = runBusinessLogic(forensics);
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
            const result = runBusinessLogic(forensics);
            expect(result).toEqual({
                intent: 'PERJUICIO',
                impact_score: -10,
                recommendation: 'IMPUGNAR',
                legal_grounding: expect.stringContaining("Alteración de resultados electorales")
            });
        });
    });

    describe("BENEFICIO scenarios", () => {
        it("should detect BENEFICIO (SILENT_LOG) when client votes are added and STRICT_ETHICS is false", () => {
            (POLITICAL_CONFIG as any).STRICT_ETHICS = false;
             const forensics: ForensicDetail[] = [{
                type: "ENMENDADURA",
                description: "Votes added to client",
                affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                original_value_inferred: 40,
                final_value_legible: 50, // +10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics);
            expect(result).toEqual({
                intent: 'BENEFICIO',
                impact_score: 10,
                recommendation: 'SILENT_LOG',
                legal_grounding: expect.stringContaining("Inconsistencia favorable")
            });
        });

        it("should detect BENEFICIO (SILENT_LOG) when rival votes are removed and STRICT_ETHICS is false", () => {
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
            const result = runBusinessLogic(forensics);
            expect(result).toEqual({
                intent: 'BENEFICIO',
                impact_score: 10,
                recommendation: 'SILENT_LOG',
                legal_grounding: expect.stringContaining("Inconsistencia favorable")
            });
        });

        it("should detect BENEFICIO (RECONTEO) when STRICT_ETHICS is true", () => {
            (POLITICAL_CONFIG as any).STRICT_ETHICS = true;
             const forensics: ForensicDetail[] = [{
                type: "ENMENDADURA",
                description: "Votes added to client",
                affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                original_value_inferred: 40,
                final_value_legible: 50, // +10 votes
                confidence: 0.9
            }];
            const result = runBusinessLogic(forensics);
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

            const result = runBusinessLogic(forensics);
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
