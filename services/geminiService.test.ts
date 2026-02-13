import { describe, it, expect, mock, beforeAll } from "bun:test";
import { ForensicDetail, VoteCount } from "../types";

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

  beforeAll(async () => {
      const module = await import("./geminiService");
      runBusinessLogic = module.runBusinessLogic;
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
  });
});
