import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock child components
mock.module('./components/Sidebar', () => {
  return {
    default: ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
      <div data-testid="sidebar">
        <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveTab('live')}>Live</button>
        <button onClick={() => setActiveTab('audit')}>Audit</button>
        <button onClick={() => setActiveTab('data')}>Data</button>
      </div>
    )
  };
});

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
    const { getByTestId } = render(<App />);
    expect(getByTestId('sidebar')).toBeTruthy();
    expect(getByTestId('dashboard')).toBeTruthy();
  });

  it('switches to Live Monitor when tab is clicked', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<App />);
    const liveButton = getByText('Live');
    fireEvent.click(liveButton);

    await waitFor(() => {
        expect(getByTestId('live-monitor')).toBeTruthy();
    });
    expect(queryByTestId('dashboard')).toBeNull();
  });

  it('switches to Manual Audit when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const auditButton = getByText('Audit');
      fireEvent.click(auditButton);

      await waitFor(() => {
          expect(getByTestId('manual-audit')).toBeTruthy();
      });
  });

  it('switches to Data Lake when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const dataButton = getByText('Data');
      fireEvent.click(dataButton);

      await waitFor(() => {
          expect(getByTestId('data-lake')).toBeTruthy();
      });
  });

  it('updates header text based on active tab', async () => {
      const { getByText } = render(<App />);

      // Default Dashboard
      expect(getByText('Control Center')).toBeTruthy();

      // Live
      fireEvent.click(getByText('Live'));
      await waitFor(() => {
          expect(getByText('Architecture & Live Logs')).toBeTruthy();
      });

      // Audit
      fireEvent.click(getByText('Audit'));
      await waitFor(() => {
          expect(getByText('Manual Forensic Audit')).toBeTruthy();
      });

      // Data
      fireEvent.click(getByText('Data'));
      await waitFor(() => {
          expect(getByText('Data Lake (PocketBase)')).toBeTruthy();
      });
  });
});
