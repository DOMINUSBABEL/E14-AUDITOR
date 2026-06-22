import { describe, it, expect } from "bun:test";
import { analyzeElectionAct } from "./server";
import { POLITICAL_CONFIG } from "./constants";

describe("Server Local Auditing Provider", () => {
  it("should process an E14 image locally without API keys", async () => {
    const base64Image = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 1x1 gif
    const mimeType = "image/gif";
    const fileName = "test_table_123.gif";

    const result = await analyzeElectionAct(base64Image, mimeType, fileName, {
      clientParty: POLITICAL_CONFIG.CLIENT_NAME,
      rivalParties: POLITICAL_CONFIG.RIVALS,
      autoDetect: true,
      // @ts-ignore
      provider: "local"
    });

    expect(result).toBeObject();
    expect(result).toHaveProperty("estado");
    expect(result.estado).toBeOneOf(["IMPUGNABLE", "NO IMPUGNABLE"]);
    expect(result).toHaveProperty("nivel_de_confianza");
    expect(result).toHaveProperty("votes");
    expect(result.votes).toBeArray();
    expect(result.votes!.length).toBe(5);
    
    // Verify votes include client and rival
    const voteParties = result.votes!.map(v => v.party);
    expect(voteParties).toContain(POLITICAL_CONFIG.CLIENT_NAME);
    expect(voteParties).toContain(POLITICAL_CONFIG.RIVALS[0]);

    // Verify arithmetic consistency fields
    expect(result).toHaveProperty("total_calculated");
    expect(result).toHaveProperty("total_declared");
    expect(result).toHaveProperty("is_fraud");
    expect(result).toHaveProperty("forensic_analysis");
    expect(result).toHaveProperty("strategic_analysis");
    expect(result.strategic_analysis).toHaveProperty("intent");
    expect(result.strategic_analysis).toHaveProperty("recommendation");
  });

  it("should be deterministic for the same image contents", async () => {
    const base64Image = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const mimeType = "image/gif";
    const fileName = "test_table_deterministic.gif";

    const config = {
      clientParty: POLITICAL_CONFIG.CLIENT_NAME,
      rivalParties: POLITICAL_CONFIG.RIVALS,
      autoDetect: true,
      provider: "local"
    };

    // Run first time
    const result1 = await analyzeElectionAct(base64Image, mimeType, fileName, config as any);

    // Run second time
    const result2 = await analyzeElectionAct(base64Image, mimeType, fileName, config as any);

    // Assert absolute identity of data
    expect(result1.votes).toEqual(result2.votes);
    expect(result1.total_calculated).toBe(result2.total_calculated);
    expect(result1.total_declared).toBe(result2.total_declared);
    expect(result1.is_fraud).toBe(result2.is_fraud);
    expect(result1.estado).toBe(result2.estado);
    expect(result1.forensic_analysis).toEqual(result2.forensic_analysis);
    expect(result1.conclusion).toBe(result2.conclusion);
  });

  it("should produce a different result for different image contents", async () => {
    const img1 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const img2 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAA7"; // altered last pixel
    
    const config = {
      clientParty: POLITICAL_CONFIG.CLIENT_NAME,
      rivalParties: POLITICAL_CONFIG.RIVALS,
      autoDetect: true,
      provider: "local"
    };

    const result1 = await analyzeElectionAct(img1, "image/gif", "act1.gif", config as any);
    const result2 = await analyzeElectionAct(img2, "image/gif", "act1.gif", config as any);

    // They should be different due to seeding
    const sameVotes = JSON.stringify(result1.votes) === JSON.stringify(result2.votes);
    const sameFraud = result1.is_fraud === result2.is_fraud;
    
    // We expect at least the random variables (votes or fraud) to differ
    expect(sameVotes && sameFraud).toBeFalse();
  });
});
