import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

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

      // Default Dashboard - "Control Center" is in sidebar and header, so use getAllByText
      expect(getAllByText('Control Center').length).toBeGreaterThan(0);

      // Live
      fireEvent.click(getByText('Architecture & Logs'));
      await waitFor(() => {
          expect(getByText('Architecture & Live Logs')).toBeTruthy();
      });

      // Audit
      fireEvent.click(getByText('Forensic Audit'));
      await waitFor(() => {
          expect(getByText('Manual Forensic Audit')).toBeTruthy();
      });

      // Data
      fireEvent.click(getByText('Data Lake'));
      await waitFor(() => {
          expect(getByText('Data Lake (PocketBase)')).toBeTruthy();
      });
  });
});
