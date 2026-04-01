import { expect, test, describe, beforeEach, spyOn } from "bun:test";
import { generateLegalTemplate } from "./LegalUtils";
import { AnalyzedAct } from "../types";

describe("generateLegalTemplate", () => {
  const mockDate = "20 de mayo de 2024";

  beforeEach(() => {
    spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue(mockDate);
  });

  const baseAct: AnalyzedAct = {
    id: "test-id",
    mesa: "001",
    zona: "01",
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: new Date().toISOString(),
    isoTimestamp: new Date().toISOString(),
    status: 'completed'
  };

  test("should generate a Negative Report when not impugnable", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      document_integrity: {
        estado: 'NO IMPUGNABLE',
        hallazgos: [],
        nivel_de_confianza: 'Alto',
        conclusion: 'Todo bien'
      }
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("REPORTE DE AUDITORÍA NEGATIVO - MESA 001");
    expect(result).toContain("FECHA: 20 de mayo de 2024");
    expect(result).toContain("NO EXISTEN MÉRITOS JURÍDICOS");
    expect(result).toContain("NIVEL DE CONFIANZA: Alto");
  });

  test("should generate a Judicial Demand when is_fraud is true", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: true,
      forensic_analysis: [
        {
          type: 'TACHON',
          description: 'Tachón detectado',
          affected_party: 'Partido A',
          original_value_inferred: 10,
          final_value_legible: 20,
          confidence: 0.95
        }
      ],
      document_integrity: {
        estado: 'IMPUGNABLE',
        hallazgos: ['Tachón'],
        nivel_de_confianza: 'Medio',
        conclusion: 'Fraude detectado'
      }
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("REF: ACCIÓN DE NULIDAD ELECTORAL E IMPUGNACIÓN DE MESA DE VOTACIÓN");
    expect(result).toContain("DEMANDADO: ACTO DE ELECCIÓN Y ESCRUTINIO - MESA 001");
    expect(result).toContain("- Se detectó tachon en la casilla de Partido A, con una confianza del 95%.");
    expect(result).toContain("NIVEL DE CONFIANZA: Medio");
  });

  test("should generate a Judicial Demand when estado is IMPUGNABLE even if is_fraud is false", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: false,
      document_integrity: {
        estado: 'IMPUGNABLE',
        hallazgos: [],
        nivel_de_confianza: 'Bajo',
        conclusion: 'Inconsistencias'
      }
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("REF: ACCIÓN DE NULIDAD ELECTORAL E IMPUGNACIÓN DE MESA DE VOTACIÓN");
    expect(result).toContain("NIVEL DE CONFIANZA: Bajo");
  });

  test("should include arithmetic discrepancy when no forensic findings are present in a fraud case", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: true,
      total_calculated: 100,
      total_declared: 110,
      forensic_analysis: []
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("Discrepancia aritmética: Total Calculado (100) vs Total Declarado (110)");
  });

  test("should use 'exclusión injustificada de votos válidos' when intent is PERJUICIO", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: true,
      strategic_analysis: {
        intent: 'PERJUICIO',
        impact_score: -10,
        recommendation: 'IMPUGNAR'
      }
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("la exclusión injustificada de votos válidos");
  });

  test("should use 'introducción de votos espurios o inexistentes' when intent is NOT PERJUICIO", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: true,
      strategic_analysis: {
        intent: 'BENEFICIO',
        impact_score: 10,
        recommendation: 'IMPUGNAR'
      }
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("la introducción de votos espurios o inexistentes");
  });

  test("should handle missing strategic_analysis by defaulting to 'introducción de votos espurios'", () => {
    const act: AnalyzedAct = {
      ...baseAct,
      is_fraud: true
    };

    const result = generateLegalTemplate(act);
    expect(result).toContain("la introducción de votos espurios o inexistentes");
  });
});
