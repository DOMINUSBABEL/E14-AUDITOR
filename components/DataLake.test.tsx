import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DataLake from "./DataLake";
import { AnalyzedAct } from "../types";
// Mock URL for export functionality (even if not explicitly testing it here)
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

// Mock acts data
const mockActs: AnalyzedAct[] = [
  {
    id: "act-001",
    mesa: "Mesa Alpha",
    zona: "Zona 1",
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: "2023-01-01T10:00:00Z",
    isoTimestamp: "2023-01-01T10:00:00Z",
    status: "completed",
    strategic_analysis: {
        intent: "NEUTRO",
        impact_score: 0,
        recommendation: "VALIDAR"
    }
  },
  {
    id: "act-002",
    mesa: "Mesa Beta",
    zona: "Zona 2",
    votes: [],
    total_calculated: 150,
    total_declared: 150,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: "2023-01-01T11:00:00Z",
    isoTimestamp: "2023-01-01T11:00:00Z",
    status: "completed",
    strategic_analysis: {
        intent: "BENEFICIO",
        impact_score: 10,
        recommendation: "IMPUGNAR"
    }
  },
  {
    id: "ACT-003",
    mesa: "Mesa Gamma",
    zona: "Zona 3",
    votes: [],
    total_calculated: 200,
    total_declared: 200,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: "2023-01-01T12:00:00Z",
    isoTimestamp: "2023-01-01T12:00:00Z",
    status: "completed",
    strategic_analysis: {
        intent: "PERJUICIO",
        impact_score: -5,
        recommendation: "RECONTEO"
    }
  }
];

describe("DataLake Component Filtering", () => {
  beforeEach(() => {
    // Setup mocks
    (URL.createObjectURL as any) = () => "blob:mock-url";
    (URL.revokeObjectURL as any) = () => {};
  });

  afterEach(() => {
    cleanup();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  test("renders all acts initially", () => {
    const { getByText } = render(<DataLake acts={mockActs} />);
    expect(getByText("Mesa Alpha")).toBeTruthy();
    expect(getByText("Mesa Beta")).toBeTruthy();
    expect(getByText("Mesa Gamma")).toBeTruthy(); // Check mesa name
  });

  test("filters by Mesa name (case insensitive)", () => {
    const { getByPlaceholderText, queryByText } = render(<DataLake acts={mockActs} />);
    const searchInput = getByPlaceholderText(/Search Mesa ID, Zona, or Ref/i);

    // Search "alpha" -> should match "Mesa Alpha"
    fireEvent.change(searchInput, { target: { value: "alpha" } });

    expect(queryByText("Mesa Alpha")).toBeTruthy();
    expect(queryByText("Mesa Beta")).toBeNull();
    expect(queryByText("Mesa Gamma")).toBeNull();
  });

  test("filters by Zona name (case insensitive)", () => {
    const { getByPlaceholderText, queryByText } = render(<DataLake acts={mockActs} />);
    const searchInput = getByPlaceholderText(/Search Mesa ID, Zona, or Ref/i);

    // Search "zona 2" -> should match "Zona 2"
    fireEvent.change(searchInput, { target: { value: "zona 2" } });

    expect(queryByText("Mesa Beta")).toBeTruthy(); // Mesa Beta is in Zona 2
    expect(queryByText("Mesa Alpha")).toBeNull();
  });

  test("filters by ID (exact case match based on current implementation)", () => {
    const { getByPlaceholderText, queryByText } = render(<DataLake acts={mockActs} />);
    const searchInput = getByPlaceholderText(/Search Mesa ID, Zona, or Ref/i);

    // Search "ACT" -> should match "ACT-003" but NOT "act-001" if ID check is case-sensitive
    // Current implementation: act.id.includes(searchTerm)
    // act-001.includes("ACT") -> false
    // ACT-003.includes("ACT") -> true

    fireEvent.change(searchInput, { target: { value: "ACT" } });

    expect(queryByText("Mesa Gamma")).toBeTruthy(); // ID: ACT-003
    expect(queryByText("Mesa Alpha")).toBeNull(); // ID: act-001
    expect(queryByText("Mesa Beta")).toBeNull(); // ID: act-002
  });

  test("filters by partial match", () => {
    const { getByPlaceholderText, queryByText } = render(<DataLake acts={mockActs} />);
    const searchInput = getByPlaceholderText(/Search Mesa ID, Zona, or Ref/i);

    // Search "00" -> matches "001", "002", "003" in IDs
    fireEvent.change(searchInput, { target: { value: "00" } });

    expect(queryByText("Mesa Alpha")).toBeTruthy();
    expect(queryByText("Mesa Beta")).toBeTruthy();
    expect(queryByText("Mesa Gamma")).toBeTruthy();

    // Search "mesa" -> matches all mesas
    fireEvent.change(searchInput, { target: { value: "mesa" } });
    expect(queryByText("Mesa Alpha")).toBeTruthy();
    expect(queryByText("Mesa Beta")).toBeTruthy();
  });

  test("handles empty search term", () => {
    const { getByPlaceholderText, queryByText } = render(<DataLake acts={mockActs} />);
    const searchInput = getByPlaceholderText(/Search Mesa ID, Zona, or Ref/i);

    fireEvent.change(searchInput, { target: { value: "alpha" } });
    expect(queryByText("Mesa Beta")).toBeNull();

    fireEvent.change(searchInput, { target: { value: "" } });
    expect(queryByText("Mesa Alpha")).toBeTruthy();
    expect(queryByText("Mesa Beta")).toBeTruthy();
    expect(queryByText("Mesa Gamma")).toBeTruthy();
  });
});
