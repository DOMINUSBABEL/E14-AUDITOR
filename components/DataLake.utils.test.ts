
import { test, expect, describe } from "bun:test";
import { generateCSVChunks } from "./DataLake.utils";
import { AnalyzedAct } from "../types";

describe("generateCSVChunks", () => {
  const mockActs: AnalyzedAct[] = [
    {
      id: "act-1",
      mesa: "Mesa 1",
      zona: "Zona A",
      votes: [],
      total_calculated: 100,
      total_declared: 100,
      is_legible: true,
      is_fraud: false,
      forensic_analysis: [],
      strategic_analysis: {
        intent: "BENEFICIO",
        impact_score: 10,
        recommendation: "IMPUGNAR",
      },
      timestamp: "2023-01-01T12:00:00Z",
      isoTimestamp: "2023-01-01T12:00:00Z",
      status: "completed",
    },
    {
      id: "act-2",
      mesa: "Mesa 2",
      zona: "Zona B",
      votes: [],
      total_calculated: 200,
      total_declared: 220,
      is_legible: true,
      is_fraud: true,
      forensic_analysis: [
        {
          type: "TACHON",
          description: "Ink smear",
          affected_party: "Party X",
          original_value_inferred: 10,
          final_value_legible: 20,
          confidence: 0.8,
        },
      ],
      timestamp: "2023-01-01T13:00:00Z",
      isoTimestamp: "2023-01-01T13:00:00Z",
      status: "completed",
    },
  ];

  test("should export headers correctly", () => {
    const columns = ["id", "mesa"];
    const chunks = generateCSVChunks([], columns);
    expect(chunks[0]).toBe("id,mesa");
    expect(chunks[1]).toBe("\n");
  });

  test("should export basic data correctly", () => {
    const columns = ["id", "mesa", "total_calculated"];
    const chunks = generateCSVChunks(mockActs, columns);

    // Header
    expect(chunks[0]).toBe("id,mesa,total_calculated");

    // Row 1
    // Strings are quoted: "act-1","Mesa 1",100 (Wait, numbers are NOT quoted in CSV usually, but code does quote strings)
    // Current logic: typeof val === 'string' -> quote it. 100 is number -> not quoted.
    expect(chunks[2]).toBe('"act-1","Mesa 1",100');
    expect(chunks[3]).toBe("\n");

    // Row 2
    expect(chunks[4]).toBe('"act-2","Mesa 2",200');
  });

  test("should handle strategic fields correctly", () => {
    const columns = ["id", "strategic_intent", "strategic_recommendation"];
    const chunks = generateCSVChunks(mockActs, columns);

    // Row 1 (has strategic_analysis)
    // intent: BENEFICIO, recommendation: IMPUGNAR
    expect(chunks[2]).toBe('"act-1","BENEFICIO","IMPUGNAR"');

    // Row 2 (no strategic_analysis - wait, mockActs[1] has undefined strategic_analysis in my definition? Ah, type allows optional)
    // mockActs[1] in my definition above does NOT have strategic_analysis.
    // So it should default to 'N/A'.
    expect(chunks[4]).toBe('"act-2","N/A","N/A"');
  });

  test("should handle forensic summary correctly", () => {
    const columns = ["id", "forensic_summary"];
    const chunks = generateCSVChunks(mockActs, columns);

    // Row 1: empty forensic_analysis -> 'None'? Or empty string?
    // Code says: act.forensic_analysis.map(...).join('; ') || 'None'
    // Empty array map returns empty array. Join returns empty string. So 'None'.
    expect(chunks[2]).toBe('"act-1","None"');

    // Row 2: 1 item -> TACHON (Party X)
    expect(chunks[4]).toBe('"act-2","TACHON (Party X)"');
  });

  test("should handle CSV escaping for quotes", () => {
    const actWithQuotes = {
      ...mockActs[0],
      id: 'act-"quote"',
      mesa: 'Mesa, with comma',
    };
    const columns = ["id", "mesa"];
    const chunks = generateCSVChunks([actWithQuotes], columns);

    // "act-""quote""","Mesa, with comma"
    // Note: implementation escapes " by doubling it: ""
    // And wraps in quotes.
    expect(chunks[2]).toBe('"act-""quote""","Mesa, with comma"');
  });

  test("should handle null/undefined values gracefully", () => {
      const actWithNull = {
          ...mockActs[0],
          // @ts-ignore
          mesa: null,
          // @ts-ignore
          zona: undefined
      };
      const columns = ["id", "mesa", "zona"];
      const chunks = generateCSVChunks([actWithNull], columns);

      // null/undefined become empty strings ''
      // empty string is string -> quoted ""?
      // implementation: val === undefined || val === null ? '' : val;
      // typeof '' is string. So it gets quoted as "".

      expect(chunks[2]).toBe('"act-1","",""');
  });
});
