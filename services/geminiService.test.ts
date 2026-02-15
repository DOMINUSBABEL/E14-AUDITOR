import { describe, it, expect, beforeEach } from "bun:test";
import { POLITICAL_CONFIG } from "../constants";

// Import the service - no need for dynamic import since global mock is already set up
import { analyzeElectionAct, runBusinessLogic } from "./geminiService";

// Access the global mock
const generateContentMock = (global as any).generateContentMock;

describe("Gemini Service", () => {

    beforeEach(() => {
        generateContentMock.mockReset();
    });

    describe("analyzeElectionAct", () => {
        it("should successfully analyze an election act and return parsed data", async () => {
            const mockResponseData = {
                mesa: "123",
                zona: "01",
                votes: [
                    { party: "Pacto Histórico", count: 100 },
                    { party: "Centro Democrático", count: 50 }
                ],
                total_calculated: 150,
                total_declared: 150,
                is_fraud: false,
                forensic_analysis: []
            };

            generateContentMock.mockResolvedValue({
                text: JSON.stringify(mockResponseData)
            });

            const result = await analyzeElectionAct("base64data", "image/png");

            expect(generateContentMock).toHaveBeenCalled();
            expect(result.mesa).toBe("123");
            expect(result.total_calculated).toBe(150);
            expect(result.votes).toHaveLength(2);
            expect(result.strategic_analysis).toBeDefined();
            expect(result.strategic_analysis?.intent).toBe("NEUTRO");
        });

        it("should handle forensic analysis indicating fraud (Perjuicio)", async () => {
            const mockResponseData = {
                mesa: "123",
                zona: "01",
                votes: [{ party: POLITICAL_CONFIG.CLIENT_NAME, count: 80 }],
                total_calculated: 80,
                total_declared: 100,
                is_fraud: true,
                forensic_analysis: [
                    {
                        type: "TACHON",
                        description: "Votes altered",
                        affected_party: POLITICAL_CONFIG.CLIENT_NAME,
                        original_value_inferred: 100,
                        final_value_legible: 80,
                        confidence: 0.95
                    }
                ]
            };

            generateContentMock.mockResolvedValue({
                text: JSON.stringify(mockResponseData)
            });

            const result = await analyzeElectionAct("base64data", "image/png");

            expect(result.is_fraud).toBe(true);
            expect(result.forensic_analysis).toHaveLength(1);
            expect(result.strategic_analysis?.intent).toBe("PERJUICIO");
            expect(result.strategic_analysis?.recommendation).toBe("IMPUGNAR");
        });

        it("should throw an error when Gemini returns no response", async () => {
            generateContentMock.mockResolvedValue({ text: null });

            try {
                await analyzeElectionAct("base64data", "image/png");
                expect().fail("Should have thrown an error");
            } catch (error) {
                expect((error as Error).message).toBe("No response from Gemini");
            }
        });

        it("should throw an error when Gemini API fails", async () => {
            generateContentMock.mockRejectedValue(new Error("API Error"));

            try {
                await analyzeElectionAct("base64data", "image/png");
                expect().fail("Should have thrown an error");
            } catch (error) {
                expect((error as Error).message).toBe("API Error");
            }
        });
    });

    describe("runBusinessLogic", () => {
        const clientName = POLITICAL_CONFIG.CLIENT_NAME;
        const rivalName = POLITICAL_CONFIG.RIVALS[0];

        it("should return NEUTRO/VALIDAR when no forensics issues found", () => {
            const result = runBusinessLogic([], []);
            expect(result.intent).toBe("NEUTRO");
            expect(result.recommendation).toBe("VALIDAR");
            expect(result.impact_score).toBe(0);
        });

        it("should identify PERJUICIO when client votes are reduced", () => {
            const forensics = [{
                type: "ENMENDADURA",
                description: "Reduced votes",
                affected_party: clientName,
                original_value_inferred: 100,
                final_value_legible: 80,
                confidence: 0.9
            }];

            // Expected impact: -|80-100| = -20
            const result = runBusinessLogic(forensics as any, []);
            expect(result.intent).toBe("PERJUICIO");
            expect(result.recommendation).toBe("IMPUGNAR");
            expect(result.impact_score).toBe(-20);
        });

        it("should identify BENEFICIO when client votes are increased", () => {
            const forensics = [{
                type: "ENMENDADURA",
                description: "Increased votes",
                affected_party: clientName,
                original_value_inferred: 80,
                final_value_legible: 100,
                confidence: 0.9
            }];

            // Expected impact: +20
            const result = runBusinessLogic(forensics as any, []);
            expect(result.intent).toBe("BENEFICIO");
            expect(result.impact_score).toBe(20);

            if (POLITICAL_CONFIG.STRICT_ETHICS) {
                expect(result.recommendation).toBe("RECONTEO");
            } else {
                expect(result.recommendation).toBe("SILENT_LOG");
            }
        });

        it("should identify PERJUICIO when rival votes are increased", () => {
            const forensics = [{
                type: "TACHON",
                description: "Rival gained votes",
                affected_party: rivalName,
                original_value_inferred: 50,
                final_value_legible: 100,
                confidence: 0.9
            }];

            // Delta: 50 (positive for rival) -> Negative impact for client
            // Impact: -50
            const result = runBusinessLogic(forensics as any, []);
            expect(result.intent).toBe("PERJUICIO");
            expect(result.recommendation).toBe("IMPUGNAR");
            expect(result.impact_score).toBe(-50);
        });

        it("should identify BENEFICIO when rival votes are reduced", () => {
            const forensics = [{
                type: "TACHON",
                description: "Rival lost votes",
                affected_party: rivalName,
                original_value_inferred: 100,
                final_value_legible: 50,
                confidence: 0.9
            }];

            // Delta: -50 (negative for rival) -> Benefit for client
            // Impact: +50
            const result = runBusinessLogic(forensics as any, []);
            expect(result.intent).toBe("BENEFICIO");
            expect(result.impact_score).toBe(50);
        });
    });
});
