import { describe, test, expect } from "bun:test";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import DataLake from "./DataLake";
import { AnalyzedAct } from "../types";

const mockActs: AnalyzedAct[] = [
  {
    id: "act-1",
    mesa: "Mesa 101",
    zona: "Zona A",
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    strategic_analysis: {
      intent: "NEUTRO",
      impact_score: 0,
      recommendation: "VALIDAR",
    },
    timestamp: "2023-01-01 12:00:00",
    isoTimestamp: "2023-01-01T12:00:00Z",
    status: "completed",
  },
  {
    id: "act-2",
    mesa: "Mesa 102",
    zona: "Zona B",
    votes: [],
    total_calculated: 200,
    total_declared: 220,
    is_legible: true,
    is_fraud: true,
    forensic_analysis: [],
    strategic_analysis: {
      intent: "PERJUICIO",
      impact_score: 10,
      recommendation: "IMPUGNAR",
    },
    timestamp: "2023-01-01 13:00:00",
    isoTimestamp: "2023-01-01T13:00:00Z",
    status: "completed",
  },
];

describe("DataLake Component", () => {
  test("renders empty state when acts list is empty", () => {
    const { getByText } = render(<DataLake acts={[]} />);

    expect(getByText("No records found matching your search.")).toBeTruthy();
    expect(getByText(/0 records in Data Lake/)).toBeTruthy();
  });

  test("renders acts when provided", () => {
    const { getByText, queryByText } = render(<DataLake acts={mockActs} />);

    expect(queryByText("No records found matching your search.")).toBeNull();
    expect(getByText("Mesa 101")).toBeTruthy();
    expect(getByText("Mesa 102")).toBeTruthy();
    expect(getByText(/2 records in Data Lake/)).toBeTruthy();
  });

  test("filters acts based on search term", async () => {
    const user = userEvent.setup();
    const { getByText, queryByText, getByPlaceholderText } = render(<DataLake acts={mockActs} />);

    const searchInput = getByPlaceholderText("Search Mesa ID, Zona, or Ref...");
    await user.type(searchInput, "Mesa 101");

    expect(getByText("Mesa 101")).toBeTruthy();
    expect(queryByText("Mesa 102")).toBeNull();
  });

  test("renders empty state when search term matches nothing", async () => {
    const user = userEvent.setup();
    const { getByText, queryByText, getByPlaceholderText } = render(<DataLake acts={mockActs} />);

    const searchInput = getByPlaceholderText("Search Mesa ID, Zona, or Ref...");
    await user.type(searchInput, "NonExistent");

    expect(getByText("No records found matching your search.")).toBeTruthy();
    expect(queryByText("Mesa 101")).toBeNull();
    expect(queryByText("Mesa 102")).toBeNull();
  });
});
