import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';
import { AnalyzedAct, SystemMetrics } from '../types';

// Mock Recharts
mock.module('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: () => <div>BarChart</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: () => <div>PieChart</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

// Mock Lucide Icons
mock.module('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-triangle" />,
  CheckCircle: () => <svg data-testid="check-circle" />,
  Clock: () => <svg data-testid="clock" />,
  FileText: () => <svg data-testid="file-text" />,
  Bell: () => <svg data-testid="bell" />,
  Settings: () => <svg data-testid="settings" />,
  X: () => <svg data-testid="x" />,
  Mail: () => <svg data-testid="mail" />,
  MessageSquare: () => <svg data-testid="message-square" />,
}));

const mockMetrics: SystemMetrics = {
  totalProcessed: 1000,
  fraudDetected: 50,
  queueSize: 10,
  activeWorkers: 5,
  cpuLoad: 20,
  ramUsage: 40,
};

const mockActs: AnalyzedAct[] = [
  {
    id: 'act-1',
    mesa: 'Mesa 101',
    zona: 'Zona A',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: true, // Fraud
    forensic_analysis: [],
    timestamp: '2023-10-27T10:00:00Z',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed',
  },
  {
    id: 'act-2',
    mesa: 'Mesa 102',
    zona: 'Zona B',
    votes: [],
    total_calculated: 200,
    total_declared: 200,
    is_legible: true,
    is_fraud: false, // Valid
    forensic_analysis: [],
    timestamp: '2023-10-27T10:05:00Z',
    isoTimestamp: '2023-10-27T10:05:00Z',
    status: 'completed',
  },
  {
    id: 'act-3',
    mesa: 'Mesa 103',
    zona: 'Zona C',
    votes: [],
    total_calculated: 150,
    total_declared: 150,
    is_legible: true,
    is_fraud: true, // Fraud
    forensic_analysis: [],
    timestamp: '2023-10-27T10:10:00Z',
    isoTimestamp: '2023-10-27T10:10:00Z',
    status: 'completed',
  },
];

describe('Dashboard Component', () => {
  it('renders fraud alerts correctly', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Check if fraud acts are displayed
    expect(screen.getByText('Mesa 101')).toBeTruthy();
    expect(screen.getByText('Mesa 103')).toBeTruthy();

    // Check if valid act is NOT displayed in fraud list
    expect(screen.queryByText('Mesa 102')).toBeNull();

    // Check header stats
    expect(screen.getByText('1,000')).toBeTruthy(); // Total Processed
    expect(screen.getByText('50')).toBeTruthy();    // Fraud Detected
  });

  it('renders "No fraud alerts" when no fraud acts exist', () => {
    const noFraudActs = mockActs.map(a => ({ ...a, is_fraud: false }));
    render(<Dashboard metrics={mockMetrics} acts={noFraudActs} />);

    expect(screen.getByText('No fraud alerts detected in current batch.')).toBeTruthy();
    expect(screen.queryByText('Mesa 101')).toBeNull();
  });
});
