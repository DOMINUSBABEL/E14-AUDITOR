import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock child components
// Removed global mocks to prevent leaking into unit tests.
// Dependencies (like lucide-react) are mocked in test-setup.ts.

describe('App Component', () => {
  it('renders sidebar and dashboard by default', () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId('sidebar')).toBeTruthy();
    expect(getByTestId('dashboard')).toBeTruthy();
  });

  it('switches to Live Monitor when tab is clicked', async () => {
    const { getByText, getByTestId, queryByTestId } = render(<App />);
    const liveButton = getByText('Architecture & Logs');
    fireEvent.click(liveButton);

    await waitFor(() => {
        expect(getByTestId('live-monitor')).toBeTruthy();
    });
    expect(queryByTestId('dashboard')).toBeNull();
  });

  it('switches to Manual Audit when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const auditButton = getByText('Forensic Audit');
      fireEvent.click(auditButton);

      await waitFor(() => {
          expect(getByTestId('manual-audit')).toBeTruthy();
      });
  });

  it('switches to Data Lake when tab is clicked', async () => {
      const { getByText, getByTestId } = render(<App />);
      const dataButton = getByText('Data Lake');
      fireEvent.click(dataButton);

      await waitFor(() => {
          expect(getByTestId('data-lake')).toBeTruthy();
      });
  });

  it('updates header text based on active tab', async () => {
      const { getByText, getAllByText } = render(<App />);

      // Default Dashboard (Control Center is in Sidebar AND Header)
      expect(getAllByText('Control Center')).toBeTruthy();

      // Live
      fireEvent.click(getByText('Architecture & Logs'));
      await waitFor(() => {
          // Architecture & Logs is in Sidebar, Architecture & Live Logs is in Header
          expect(getByText('Architecture & Live Logs')).toBeTruthy();
      });

      // Audit
      fireEvent.click(getByText('Forensic Audit'));
      await waitFor(() => {
          expect(getByText('Manual Forensic Audit')).toBeTruthy();
      });

      // Data
      // Data Lake is in Sidebar. Data Lake (PocketBase) is in Header
      // Since 'Data Lake' is part of 'Data Lake (PocketBase)', getByText might need partial match or exact.
      // But button is "Data Lake" (exact). Header is "Data Lake (PocketBase)".
      // We click the sidebar button.
      fireEvent.click(getByText('Data Lake'));
      await waitFor(() => {
          expect(getByText('Data Lake (PocketBase)')).toBeTruthy();
      });
  });
});
