import { describe, it, expect, afterEach, mock } from 'bun:test';
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { SystemMetrics, AnalyzedAct } from '../types';

// Mock Recharts to avoid layout issues in happy-dom
mock.module('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
  };
});

describe('Dashboard Component', () => {
  afterEach(() => {
    cleanup();
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
      mesa: 'Mesa 101',
      zona: 'Zona A',
      votes: [],
      total_calculated: 100,
      total_declared: 100,
      is_legible: true,
      is_fraud: true, // Fraud
      forensic_analysis: [],
      timestamp: '2023-10-27 10:00:00',
      isoTimestamp: '2023-10-27T10:00:00Z',
      status: 'completed',
    },
    {
      id: '2',
      mesa: 'Mesa 102',
      zona: 'Zona B',
      votes: [],
      total_calculated: 200,
      total_declared: 200,
      is_legible: true,
      is_fraud: false, // Valid
      forensic_analysis: [],
      timestamp: '2023-10-27 10:05:00',
      isoTimestamp: '2023-10-27T10:05:00Z',
      status: 'completed',
    },
  ];

  it('renders dashboard with metrics', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Check for metric titles
    expect(screen.getByText('Total Processed')).toBeTruthy();
    expect(screen.getByText('Fraud Detected')).toBeTruthy();
    expect(screen.getByText('Queue Load')).toBeTruthy();
    expect(screen.getByText('Success Rate')).toBeTruthy();

    // Check for metric values
    expect(screen.getByText('1,000')).toBeTruthy();
    expect(screen.getByText('50')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('renders charts', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(screen.getByTestId('bar-chart')).toBeTruthy();
    expect(screen.getByTestId('pie-chart')).toBeTruthy();
  });

  it('opens alert configuration modal', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Find configuration button
    const configButton = screen.getByText('Configure Alerts');
    fireEvent.click(configButton);

    // Modal should appear
    expect(screen.getByText('Alert Configuration')).toBeTruthy();

    // Check for modal content
    expect(screen.getByText('Email Notifications')).toBeTruthy();
    expect(screen.getByText('SMS / WhatsApp')).toBeTruthy();
  });

  it('renders fraud alerts table', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Check if fraud act is displayed
    expect(screen.getByText('Mesa 101')).toBeTruthy();
    expect(screen.getByText('FRAUD SUSPECT')).toBeTruthy();

    // Non-fraud act should typically NOT be in "Recent Alerts" based on component logic
    expect(screen.queryByText('Mesa 102')).toBeNull();
  });

  it('shows empty state when no fraud alerts', () => {
    const noFraudActs = mockActs.filter(a => !a.is_fraud);
    render(<Dashboard metrics={mockMetrics} acts={noFraudActs} />);

    expect(screen.getByText('No fraud alerts detected in current batch.')).toBeTruthy();
  });
});
