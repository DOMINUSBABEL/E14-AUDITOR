import { describe, it, expect, mock, beforeAll } from "bun:test";
import { ForensicDetail, VoteCount } from "../types";

describe("geminiService", () => {
  let runBusinessLogic: any;
  let analyzeElectionAct: any;

  beforeAll(async () => {
      const module = await import("./geminiService");
      runBusinessLogic = module.runBusinessLogic;
      analyzeElectionAct = module.analyzeElectionAct;
  });

  describe("analyzeElectionAct", () => {
    it("should throw error for invalid MIME type", async () => {
      const invalidMimeType = "application/pdf";
      const base64Image = "dummydata";

      expect(analyzeElectionAct(base64Image, invalidMimeType)).rejects.toThrow("Invalid image format");
    });

    it("should throw error for oversized image", async () => {
      const validMimeType = "image/jpeg";
      // 10MB limit. Base64 string length needs to correspond to > 10MB decoded.
      // 10MB = 10,485,760 bytes.
      // Base64 length = (bytes * 4) / 3 approx.
      // 10,485,760 * 4 / 3 = 13,981,013 chars.
      // Let's use 15,000,000 chars.
      const largeBase64 = "a".repeat(15_000_000);

      expect(analyzeElectionAct(largeBase64, validMimeType)).rejects.toThrow("Image too large");
    });

    it("should proceed with valid inputs", async () => {
        const validMimeType = "image/png";
        const validBase64 = "validdata";

        const result = await analyzeElectionAct(validBase64, validMimeType);
        expect(result).toBeDefined();
        expect(result.mesa).toBe("UNKNOWN");
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
  });
});
