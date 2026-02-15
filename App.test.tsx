import { describe, it, expect, mock, beforeAll } from 'bun:test';
import React from 'react';

// Define mocks
mock.module('./components/Dashboard', () => {
  return { default: () => <div data-testid="dashboard">Dashboard Component</div> };
});

mock.module('./components/LiveMonitor', () => {
  return { default: () => <div data-testid="live-monitor">LiveMonitor Component</div> };
});

mock.module('./components/ManualAudit', () => {
  return { default: () => <div data-testid="manual-audit">ManualAudit Component</div> };
});

mock.module('./components/DataLake', () => {
  return { default: () => <div data-testid="data-lake">DataLake Component</div> };
});

// Removed mock for geminiService to see if test-setup.ts handles the API key
// and to avoid breaking other tests.

describe('App Component Integration', () => {
  let App: React.ComponentType;
  let render: any;
  let fireEvent: any;
  let waitFor: any;

  beforeAll(async () => {
    // Dynamic import to ensure DOM is ready
    const rtl = await import('@testing-library/react');
    render = rtl.render;
    fireEvent = rtl.fireEvent;
    waitFor = rtl.waitFor;

    const module = await import('./App');
    App = module.default;
  });

  it('renders sidebar and dashboard by default', () => {
    const { getByText, getByTestId } = render(<App />);
    expect(getByText('AUDITOR')).toBeTruthy();
    expect(getByText('v2.0 Ryzen Core')).toBeTruthy();
    expect(getByTestId('dashboard')).toBeTruthy();
    expect(getByText('Control Center', { selector: 'h2' })).toBeTruthy();
  });

  it('switches to Live Monitor when "Architecture & Logs" tab is clicked', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<App />);
    const liveButton = getByText('Architecture & Logs');
    fireEvent.click(liveButton);

    await waitFor(() => {
        expect(getByTestId('live-monitor')).toBeTruthy();
    });
    expect(queryByTestId('dashboard')).toBeNull();
    expect(getByText('Architecture & Live Logs', { selector: 'h2' })).toBeTruthy();
  });

  it('switches to Manual Audit when "Forensic Audit" tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const auditButton = getByText('Forensic Audit');
      fireEvent.click(auditButton);

      await waitFor(() => {
          expect(getByTestId('manual-audit')).toBeTruthy();
      });
      expect(getByText('Manual Forensic Audit', { selector: 'h2' })).toBeTruthy();
  });

  it('switches to Data Lake when "Data Lake" tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const dataButton = getByText('Data Lake');
      fireEvent.click(dataButton);

      await waitFor(() => {
          expect(getByTestId('data-lake')).toBeTruthy();
      });
      expect(getByText('Data Lake (PocketBase)', { selector: 'h2' })).toBeTruthy();
  });
});
