import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import Dashboard from './Dashboard';
import { SystemMetrics, AnalyzedAct } from '../types';
// Mock recharts
mock.module('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
}));

const mockMetrics: SystemMetrics = {
  totalProcessed: 1000,
  fraudDetected: 50,
  queueSize: 10,
  activeWorkers: 5,
  cpuLoad: 20,
  ramUsage: 30
};

const mockActs: AnalyzedAct[] = [
  {
    id: '1',
    mesa: 'Mesa 1',
    zona: 'Zona A',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: true,
    forensic_analysis: [],
    timestamp: '2023-10-27T10:00:00Z',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed'
  },
  {
    id: '2',
    mesa: 'Mesa 2',
    zona: 'Zona B',
    votes: [],
    total_calculated: 200,
    total_declared: 200,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: '2023-10-27T10:05:00Z',
    isoTimestamp: '2023-10-27T10:05:00Z',
    status: 'completed'
  }
];

describe('Dashboard Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);
    expect(screen.getByText('Total Processed')).toBeTruthy();
  });

  it('displays fraud acts correctly', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);
    // Check if the fraud act is displayed in the table
    expect(screen.getAllByText('Mesa 1')).toHaveLength(1);
    // Check if non-fraud act is NOT displayed in the table (since table filters for fraud)
    expect(screen.queryByText('Mesa 2')).toBeNull();
  });

  it('displays correct message when no fraud acts', () => {
    const noFraudActs = mockActs.filter(a => !a.is_fraud);
    render(<Dashboard metrics={mockMetrics} acts={noFraudActs} />);
    expect(screen.getByText('No fraud alerts detected in current batch.')).toBeTruthy();
  });
});
