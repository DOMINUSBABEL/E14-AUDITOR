import { test, expect, describe, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import DataLake from "./DataLake";
import { AnalyzedAct } from "../types";

// Mock Data
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
    mesa: "Mesa 202",
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

describe("DataLake Component", () => {

  test("renders correctly with empty data", () => {
    render(<DataLake acts={[]} />);
    expect(screen.getByText("0 records in Data Lake")).toBeTruthy();
    expect(screen.getByText("No records found matching your search.")).toBeTruthy();
  });

  test("renders with data", () => {
    render(<DataLake acts={mockActs} />);
    expect(screen.getByText("2 records in Data Lake")).toBeTruthy();
    expect(screen.getByText("Mesa 101")).toBeTruthy();
    expect(screen.getByText("Mesa 202")).toBeTruthy();
    expect(screen.getByText("Zona A")).toBeTruthy();
    expect(screen.getByText("FRAUD")).toBeTruthy();
    expect(screen.getByText("VERIFIED")).toBeTruthy();
  });

  test("filters data by Mesa ID", async () => {
    render(<DataLake acts={mockActs} />);
    const searchInput = screen.getByPlaceholderText("Search Mesa ID, Zona, or Ref...");
    fireEvent.change(searchInput, { target: { value: "Mesa 101" } });

    await waitFor(() => {
        expect(screen.getByText("Mesa 101")).toBeTruthy();
        expect(screen.queryByText("Mesa 202")).toBeNull();
    });
  });

   test("filters data by Zona", async () => {
    render(<DataLake acts={mockActs} />);
    const searchInput = screen.getByPlaceholderText("Search Mesa ID, Zona, or Ref...");
    fireEvent.change(searchInput, { target: { value: "Zona B" } });

    await waitFor(() => {
        expect(screen.getByText("Mesa 202")).toBeTruthy();
        expect(screen.queryByText("Mesa 101")).toBeNull();
    });
  });

  test("shows empty state when filter matches nothing", async () => {
      render(<DataLake acts={mockActs} />);
      const searchInput = screen.getByPlaceholderText("Search Mesa ID, Zona, or Ref...");
      fireEvent.change(searchInput, { target: { value: "NonExistent" } });

      await waitFor(() => {
          expect(screen.getByText("No records found matching your search.")).toBeTruthy();
      });
  });

  test("opens and closes export modal", async () => {
      render(<DataLake acts={mockActs} />);
      const exportButton = screen.getByText("Export Data");
      fireEvent.click(exportButton);

      expect(screen.getByText("Export Data Lake")).toBeTruthy();

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
         expect(screen.queryByText("Export Data Lake")).toBeNull();
      });
  });

  test("handles export action", async () => {
      // Mock URL methods
      // @ts-ignore
      const originalCreateObjectURL = global.URL.createObjectURL;
      // @ts-ignore
      const originalRevokeObjectURL = global.URL.revokeObjectURL;

      const mockCreateObjectURL = mock(() => "blob:mock-url");
      const mockRevokeObjectURL = mock(() => {});

      // @ts-ignore
      global.URL.createObjectURL = mockCreateObjectURL;
      // @ts-ignore
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const originalCreateElement = document.createElement;
      let capturedLink: HTMLAnchorElement | null = null;

      // @ts-ignore
      document.createElement = mock((tagName: string, options?: any) => {
          const element = originalCreateElement.call(document, tagName, options);
          if (tagName === 'a') {
              capturedLink = element as HTMLAnchorElement;
              // Mock click to prevent actual navigation/error and verify call
              capturedLink.click = mock(() => {});
          }
          return element;
      });

      render(<DataLake acts={mockActs} />);

      // Open modal
      fireEvent.click(screen.getByText("Export Data"));

      // Click download
      const downloadButton = screen.getByText("Download CSV");
      fireEvent.click(downloadButton);

      await waitFor(() => {
          expect(mockCreateObjectURL).toHaveBeenCalled();
          expect(capturedLink).not.toBeNull();
          if (capturedLink) {
             expect(capturedLink.click).toHaveBeenCalled();
             expect(capturedLink.getAttribute("href")).toBe("blob:mock-url");
          }
      });

      // Cleanup mocks
      // @ts-ignore
      global.URL.createObjectURL = originalCreateObjectURL;
      // @ts-ignore
      global.URL.revokeObjectURL = originalRevokeObjectURL;
      document.createElement = originalCreateElement;
  });
});
