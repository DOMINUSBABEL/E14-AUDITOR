
import { test, expect, describe } from "bun:test";
import { generateCSVChunks } from "./DataLake.utils";
import { AnalyzedAct } from "../types";

describe("CSV Injection Security", () => {
  const mockAct: AnalyzedAct = {
    id: "act-1",
    mesa: "Mesa 1",
    zona: "Zona A",
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: "2023-01-01T12:00:00Z",
    isoTimestamp: "2023-01-01T12:00:00Z",
    status: "completed",
  };

  test("should escape formula characters to prevent CSV injection", () => {
    const maliciousAct = {
      ...mockAct,
      mesa: "=SUM(1,2)",
      zona: "+1+2",
      id: "-ACT1",
      timestamp: "@TODAY()"
    };
    const columns = ["id", "mesa", "zona", "timestamp"];
    const chunks = generateCSVChunks([maliciousAct as AnalyzedAct], columns);

    // Row data starts at index 2
    const row = chunks[2];

    // Check that each field starting with injection char is escaped with a single quote
    // Fixed behavior should be: '"\'-ACT1","\'=SUM(1,2)","\'+1+2","\'@TODAY()"'
    expect(row).toContain('"\'=SUM(1,2)"');
    expect(row).toContain('"\'+1+2"');
    expect(row).toContain('"\'-ACT1"');
    expect(row).toContain('"\'@TODAY()"');
  });
});
