import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { SystemMetrics, AnalyzedAct } from '../types';

// Mock Lucide React icons
mock.module('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  CheckCircle: () => <div data-testid="icon-check-circle" />,
  Clock: () => <div data-testid="icon-clock" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Bell: () => <div data-testid="icon-bell" />,
  Settings: () => <div data-testid="icon-settings" />,
  X: () => <div data-testid="icon-x" />,
  Mail: () => <div data-testid="icon-mail" />,
  MessageSquare: () => <div data-testid="icon-message-square" />,
}));

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
    id: '1',
    mesa: 'Mesa 101',
    zona: 'Zona A',
    votes: [],
    total_calculated: 100,
    total_declared: 90,
    is_legible: true,
    is_fraud: true,
    forensic_analysis: [],
    timestamp: '2023-10-27 10:00:00',
    isoTimestamp: '2023-10-27T10:00:00Z',
    status: 'completed',
  },
  {
    id: '2',
    mesa: 'Mesa 102',
    zona: 'Zona A',
    votes: [],
    total_calculated: 100,
    total_declared: 100,
    is_legible: true,
    is_fraud: false,
    forensic_analysis: [],
    timestamp: '2023-10-27 10:05:00',
    isoTimestamp: '2023-10-27T10:05:00Z',
    status: 'completed',
  }
];

describe('Dashboard Component', () => {
  it('renders metrics correctly', () => {
    const { getByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(getByText('Total Processed')).toBeTruthy();
    expect(getByText('12,345')).toBeTruthy();

    expect(getByText('Fraud Detected')).toBeTruthy();
    expect(getByText('67')).toBeTruthy();

    expect(getByText('Queue Load')).toBeTruthy();
    expect(getByText('890')).toBeTruthy();

    expect(getByText('Success Rate')).toBeTruthy();
    expect(getByText('97.4%')).toBeTruthy();
  });

  it('renders alert configuration button', () => {
    const { getByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);
    expect(getByText('Configure Alerts')).toBeTruthy();
  });

  it('opens alert configuration modal when button is clicked', async () => {
    const { getByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    const configButton = getByText('Configure Alerts');
    fireEvent.click(configButton);

    await waitFor(() => {
      expect(getByText('Alert Configuration')).toBeTruthy();
    });

    expect(getByText('Email Notifications')).toBeTruthy();
    expect(getByText('SMS / WhatsApp')).toBeTruthy();
    expect(getByText('Recipient')).toBeTruthy();
  });

  it('closes alert configuration modal when save button is clicked', async () => {
    const { getByText, queryByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Open modal
    fireEvent.click(getByText('Configure Alerts'));
    await waitFor(() => {
      expect(getByText('Alert Configuration')).toBeTruthy();
    });

    // Close modal
    fireEvent.click(getByText('Save Changes'));
    await waitFor(() => {
      expect(queryByText('Alert Configuration')).toBeNull();
    });
  });

  it('updates recipient input in modal', async () => {
    const { getByText, getByDisplayValue } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    // Open modal
    fireEvent.click(getByText('Configure Alerts'));
    await waitFor(() => {
        expect(getByText('Recipient')).toBeTruthy();
    });

    const input = getByDisplayValue('admin@auditor-ai.com');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    expect(getByDisplayValue('test@example.com')).toBeTruthy();
  });

  it('renders recent alerts table with fraud acts', () => {
    const { getByText, queryByText } = render(<Dashboard metrics={mockMetrics} acts={mockActs} />);

    expect(getByText('Recent Alerts')).toBeTruthy();
    expect(getByText('Mesa 101')).toBeTruthy();
    expect(getByText('FRAUD SUSPECT')).toBeTruthy();

    // Non-fraud acts should not be in the list
    expect(queryByText('Mesa 102')).toBeNull();
  });

  it('renders "No fraud alerts detected" when no fraud acts present', () => {
     const cleanActs = mockActs.filter(a => !a.is_fraud);
     const { getByText } = render(<Dashboard metrics={mockMetrics} acts={cleanActs} />);

     expect(getByText('No fraud alerts detected in current batch.')).toBeTruthy();
  });
});
