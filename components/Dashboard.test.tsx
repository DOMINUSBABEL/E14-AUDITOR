import { describe, it, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { SystemMetrics, AnalyzedAct } from '../types';

// Mock Lucide Icons if necessary (Assuming they work fine as SVGs, but if not, I can mock them)
// For now, relying on them rendering as SVGs which happy-dom handles well enough for "existence" checks.

const mockMetrics: SystemMetrics = {
  totalProcessed: 12345,
  fraudDetected: 67,
  queueSize: 890,
  activeWorkers: 5,
  cpuLoad: 45,
  ramUsage: 60,
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
    is_fraud: true,
    forensic_analysis: [],
    timestamp: '10:00 AM',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed',
  },
  {
    id: 'act-2',
    mesa: 'Mesa 102',
    zona: 'Zona A',
    votes: [],
    total_calculated: 200,
    total_declared: 200,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: '10:05 AM',
    isoTimestamp: '2023-10-27T10:05:00Z',
    status: 'completed',
  },
];

describe('Dashboard Component', () => {
  it('renders metric cards with correct values', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(screen.getByText('Total Processed')).toBeTruthy();
    expect(screen.getByText('12,345')).toBeTruthy(); // formatted

    expect(screen.getByText('Fraud Detected')).toBeTruthy();
    expect(screen.getByText('67')).toBeTruthy();

    expect(screen.getByText('Queue Load')).toBeTruthy();
    expect(screen.getByText('890')).toBeTruthy();

    // Static value in component
    expect(screen.getByText('Success Rate')).toBeTruthy();
    expect(screen.getByText('97.4%')).toBeTruthy();
  });

  it('renders charts', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(screen.getByTestId('bar-chart')).toBeTruthy();
    expect(screen.getByTestId('pie-chart')).toBeTruthy();
  });

  it('renders recent alerts table with fraud acts only', () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Should show the fraud act
    expect(screen.getByText('Mesa 101')).toBeTruthy();
    expect(screen.getByText('FRAUD SUSPECT')).toBeTruthy();

    // Should NOT show the non-fraud act
    expect(screen.queryByText('Mesa 102')).toBeNull();
  });

  it('renders empty state when no fraud acts', () => {
    const noFraudActs = mockActs.filter(a => !a.is_fraud);
    render(<Dashboard metrics={mockMetrics} acts={noFraudActs} />);

    expect(screen.getByText('No fraud alerts detected in current batch.')).toBeTruthy();
    expect(screen.queryByText('Mesa 101')).toBeNull();
  });

  it('handles alert configuration modal interactions', async () => {
    render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Open modal
    const configBtn = screen.getByText('Configure Alerts');
    fireEvent.click(configBtn);

    expect(screen.getByText('Alert Configuration')).toBeTruthy();

    // Check input interaction
    const recipientInput = screen.getByDisplayValue('admin@auditor-ai.com');
    fireEvent.change(recipientInput, { target: { value: 'new@email.com' } });
    expect(screen.getByDisplayValue('new@email.com')).toBeTruthy();

    // Close modal
    const saveBtn = screen.getByText('Save Changes');
    fireEvent.click(saveBtn);

    await waitFor(() => {
        expect(screen.queryByText('Alert Configuration')).toBeNull();
    });
  });
});
