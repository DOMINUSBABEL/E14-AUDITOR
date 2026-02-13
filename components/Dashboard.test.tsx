// @happy-dom
import { describe, it, expect, mock, beforeAll } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from 'react';
import Dashboard from './Dashboard';

// Mock recharts to avoid layout issues in test environment
mock.module("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>BarChart {children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>PieChart {children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  Tooltip: () => <div>Tooltip</div>,
  Pie: () => <div>Pie</div>,
  Cell: () => <div>Cell</div>,
}));

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Dashboard", () => {
  it("renders correctly with empty data", () => {
    const emptyMetrics = {
      totalProcessed: 0,
      fraudDetected: 0,
      queueSize: 0,
      activeWorkers: 0,
      cpuLoad: 0,
      ramUsage: 0,
    };

    const emptyActs: any[] = [];

    render(<Dashboard metrics={emptyMetrics} acts={emptyActs} />);

    // Check for metric cards
    expect(screen.getByText("Total Processed")).toBeTruthy();

    // Check for zero values.
    // Since there are multiple "0"s (Total Processed, Fraud Detected, Queue Load),
    // getAllByText("0") should return at least 3 elements.
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(3);

    // Check for empty state message in the table
    expect(screen.getByText("No fraud alerts detected in current batch.")).toBeTruthy();
  });
});
