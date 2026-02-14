import { describe, test, expect, mock, beforeEach, beforeAll } from "bun:test";
import { ForensicDetail, VoteCount } from "../types";
import { POLITICAL_CONFIG } from "../constants";

// Mock @google/genai module BEFORE importing the service
// We need to mock the class and its methods
const mockGenerateContent = mock(() => Promise.resolve({ text: "{}" }));

mock.module("@google/genai", () => {
  return {
    GoogleGenAI: class {
      constructor(options: any) {
        // Constructor logic if needed
      }
      get models() {
        return {
          generateContent: mockGenerateContent
        };
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

describe("Gemini Service", () => {
  let analyzeElectionAct: any;
  let runBusinessLogic: any;

  beforeAll(async () => {
    const module = await import("./geminiService");
    analyzeElectionAct = module.analyzeElectionAct;
    runBusinessLogic = module.runBusinessLogic;
  });

  beforeEach(() => {
    mockGenerateContent.mockClear();
  });

  describe("runBusinessLogic", () => {
    test("should return NEUTRO when no forensics are present", () => {
      const result = runBusinessLogic([], []);
      expect(result.intent).toBe("NEUTRO");
      expect(result.recommendation).toBe("VALIDAR");
      expect(result.impact_score).toBe(0);
    });

    test("should return PERJUICIO when client loses votes", () => {
      const forensics: ForensicDetail[] = [{
        type: "TACHON",
        description: "Vote count altered",
        affected_party: POLITICAL_CONFIG.CLIENT_NAME,
        original_value_inferred: 10,
        final_value_legible: 5,
        confidence: 0.9
      }];

      const result = runBusinessLogic(forensics, []);
      expect(result.intent).toBe("PERJUICIO");
      expect(result.recommendation).toBe("IMPUGNAR");
      expect(result.impact_score).toBe(-5); // Lost 5 votes, so impact is -5
    });

    test("should return BENEFICIO when client gains votes", () => {
      const forensics: ForensicDetail[] = [{
        type: "ENMENDADURA",
        description: "Vote count altered",
        affected_party: POLITICAL_CONFIG.CLIENT_NAME,
        original_value_inferred: 5,
        final_value_legible: 10,
        confidence: 0.9
      }];

      const result = runBusinessLogic(forensics, []);
      expect(result.intent).toBe("BENEFICIO");
      // Assuming STRICT_ETHICS is false based on constants.ts, check logic
      expect(result.recommendation).toBe(POLITICAL_CONFIG.STRICT_ETHICS ? "RECONTEO" : "SILENT_LOG");
      expect(result.impact_score).toBe(5);
    });

    test("should return PERJUICIO when rival gains votes", () => {
       const rival = POLITICAL_CONFIG.RIVALS[0];
       const forensics: ForensicDetail[] = [{
        type: "CALIGRAFIA",
        description: "Vote count altered",
        affected_party: rival,
        original_value_inferred: 5,
        final_value_legible: 10,
        confidence: 0.9
      }];

      const result = runBusinessLogic(forensics, []);
      expect(result.intent).toBe("PERJUICIO");
      expect(result.recommendation).toBe("IMPUGNAR");
      expect(result.impact_score).toBe(-5); // Rival gained 5, so impact to us is -5
    });

    test("should return BENEFICIO when rival loses votes", () => {
       const rival = POLITICAL_CONFIG.RIVALS[0];
       const forensics: ForensicDetail[] = [{
        type: "TACHON",
        description: "Vote count altered",
        affected_party: rival,
        original_value_inferred: 10,
        final_value_legible: 5,
        confidence: 0.9
      }];

      const result = runBusinessLogic(forensics, []);
      expect(result.intent).toBe("BENEFICIO");
      expect(result.recommendation).toBe(POLITICAL_CONFIG.STRICT_ETHICS ? "RECONTEO" : "SILENT_LOG");
      expect(result.impact_score).toBe(5); // Rival lost 5, benefit to us is 5
    });
  });

  describe("analyzeElectionAct", () => {
    const mockImage = "base64image";
    const mockMimeType = "image/jpeg";

    test("should analyze election act successfully", async () => {
      const mockResponseData = {
        mesa: "123",
        zona: "01",
        votes: [{ party: "Pacto Histórico", count: 100 }],
        total_calculated: 100,
        total_declared: 100,
        is_fraud: false,
        forensic_analysis: []
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponseData)
      });

      const result = await analyzeElectionAct(mockImage, mockMimeType);

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
      expect(result.mesa).toBe("123");
      expect(result.strategic_analysis).toBeDefined();
      expect(result.strategic_analysis.intent).toBe("NEUTRO");
    });

    test("should handle API errors", async () => {
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      // We expect the promise to be rejected
      // Using try/catch or .catch block for async throwing
      let error;
      try {
        await analyzeElectionAct(mockImage, mockMimeType);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as Error).message).toBe("API Error");
    });

    test("should handle empty response from API", async () => {
      mockGenerateContent.mockResolvedValue({
        text: "" // Empty string simulates failure to generate text
      });

      let error;
      try {
        await analyzeElectionAct(mockImage, mockMimeType);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as Error).message).toBe("No response from Gemini");
    });
  });
});
