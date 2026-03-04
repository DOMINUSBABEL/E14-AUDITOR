import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock Recharts globally here as well to fix App Component tests since they no longer mock Dashboard
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

// Do not mock internal components globally in integration tests

describe('App Component', () => {
  it('renders sidebar and dashboard by default', () => {
    const { getByTestId, getByText } = render(<App />);
    expect(getByText('Control Center', { selector: 'span' })).toBeTruthy(); // Sidebar item
    expect(getByTestId('dashboard')).toBeTruthy();
  });

  it('switches to Live Monitor when tab is clicked', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<App />);
    const liveButton = getByText('Architecture & Logs', { selector: 'span' });
    fireEvent.click(liveButton);

    await waitFor(() => {
        expect(getByTestId('live-monitor')).toBeTruthy();
    });
    expect(queryByTestId('dashboard')).toBeNull();
  });

  it('switches to Manual Audit when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const auditButton = getByText('Forensic Audit', { selector: 'span' });
      fireEvent.click(auditButton);

      await waitFor(() => {
          expect(getByTestId('manual-audit')).toBeTruthy();
      });
  });

  it('switches to Data Lake when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const dataButton = getByText('Data Lake', { selector: 'span' });
      fireEvent.click(dataButton);

      await waitFor(() => {
          expect(getByTestId('data-lake')).toBeTruthy();
      });
  });

  it('updates header text based on active tab', async () => {
      const { getByText } = render(<App />);

      // Default Dashboard
      expect(getByText('Control Center', { selector: 'h2' })).toBeTruthy();

      // Live
      fireEvent.click(getByText('Architecture & Logs', { selector: 'span' }));
      await waitFor(() => {
          expect(getByText('Architecture & Live Logs')).toBeTruthy();
      });

      // Audit
      fireEvent.click(getByText('Forensic Audit', { selector: 'span' }));
      await waitFor(() => {
          expect(getByText('Manual Forensic Audit')).toBeTruthy();
      });

      // Data
      fireEvent.click(getByText('Data Lake', { selector: 'span' }));
      await waitFor(() => {
          expect(getByText('Data Lake (PocketBase)')).toBeTruthy();
      });
  });
});
