import { describe, it, expect, mock, afterEach } from 'bun:test';
import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import App from './App';
import { AnalyzedAct, SystemLog } from './types';

// Mock child components to intercept props
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

mock.module('./components/Dashboard', () => {
  return {
    default: ({ acts }: { acts: AnalyzedAct[] }) => (
      <div data-testid="dashboard-data">
        {JSON.stringify(acts)}
      </div>
    )
  };
});

mock.module('./components/LiveMonitor', () => {
  return {
    default: ({ logs }: { logs: SystemLog[] }) => (
      <div data-testid="live-monitor-data">
        {JSON.stringify(logs)}
      </div>
    )
  };
});

// Mock other components just to avoid errors
mock.module('./components/ManualAudit', () => {
  return { default: () => <div data-testid="manual-audit">ManualAudit Component</div> };
});

mock.module('./components/DataLake', () => {
  return { default: () => <div data-testid="data-lake">DataLake Component</div> };
});

afterEach(() => {
  cleanup();
});

describe('App Security Check', () => {
  it('generates secure UUIDs for acts', async () => {
    const { getByTestId } = render(<App />);

    // Wait for the dashboard to render and have data
    await waitFor(() => {
      expect(getByTestId('dashboard-data')).toBeTruthy();
    });

    const dataElement = getByTestId('dashboard-data');
    const acts: AnalyzedAct[] = JSON.parse(dataElement.textContent || '[]');

    expect(acts.length).toBeGreaterThan(0);

    // Check if IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    acts.forEach(act => {
      expect(act.id).toMatch(uuidRegex);
    });
  });
});
