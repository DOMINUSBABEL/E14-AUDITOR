import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, mock } from 'bun:test';
import Dashboard from './Dashboard';
import { SystemMetrics, AnalyzedAct } from '../types';

// Mock Recharts to avoid rendering issues in test environment
mock.module('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => <div />,
    Cell: () => <div />,
  };
});

const mockMetrics: SystemMetrics = {
  totalProcessed: 1000,
  fraudDetected: 50,
  queueSize: 10,
  activeWorkers: 5,
  cpuLoad: 45,
  ramUsage: 60,
};

const mockActs: AnalyzedAct[] = [
  {
    id: '1',
    mesa: 'Mesa 1',
    zona: 'Zona 1',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: '10:00',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed',
  },
];

describe('Dashboard Component', () => {
  it('renders metric cards correctly', () => {
    const { getByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(getByText('Total Processed')).toBeTruthy();
    expect(getByText('1,000')).toBeTruthy();

    expect(getByText('Fraud Detected')).toBeTruthy();
    expect(getByText('50')).toBeTruthy();

    expect(getByText('Queue Load')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });
});
