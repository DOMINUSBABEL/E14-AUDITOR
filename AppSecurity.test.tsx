import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock child components
mock.module('./components/Sidebar', () => {
  return {
    default: ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
      <div data-testid="sidebar">
        <button onClick={() => setActiveTab('audit')}>Audit</button>
        <button onClick={() => setActiveTab('data')}>Data Lake</button>
      </div>
    )
  };
});

mock.module('./components/ManualAudit', () => {
  return {
    default: ({ onComplete }: { onComplete: (results: any[]) => void }) => (
      <div data-testid="manual-audit">
        <button onClick={() => onComplete([{ mesa: 'MESA-TEST', zona: 'ZONA-TEST' }])}>
          Simulate Audit Complete
        </button>
      </div>
    )
  };
});

// Mock Recharts
mock.module('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: () => <div />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    PieChart: () => <div />,
    Pie: () => <div />,
    Cell: () => <div />,
  };
});

describe('App ID Generation Security', () => {
  it('generates a valid UUID for audit results when ID is missing', async () => {
    const { getByText, getByTestId } = render(<App />);

    // Simulate completing an audit without an ID
    const simulateButton = getByText('Simulate Audit Complete');
    fireEvent.click(simulateButton);

    // Switch to Data Lake to see the results
    const dataLakeButton = getByText('Data Lake');
    fireEvent.click(dataLakeButton);

    await waitFor(() => {
        expect(getByTestId('data-lake')).toBeTruthy();
    });

    // Check if the new act has a UUID format ID
    // A UUID v4 has 36 characters and specific hyphen positions
    // format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // We need to find the act in the DataLake table.
    // Since DataLake renders the acts, we can look for the mesa 'MESA-TEST'
    // and then find its ID.
    // Or we can just check if any ID in the document matches the UUID regex
    // and is not one of the initial mock ones (though mock ones also use generateSecureId).

    const cells = document.querySelectorAll('td');
    let foundTestMesa = false;
    let foundUuid = false;

    cells.forEach(cell => {
      if (cell.textContent === 'MESA-TEST') {
        foundTestMesa = true;
        // The ID should be in the same row. In DataLake.tsx it seems ID is the first column.
        const row = cell.parentElement;
        if (row) {
          const idCell = row.querySelector('td'); // Assuming ID is first
          if (idCell && uuidRegex.test(idCell.textContent || '')) {
            foundUuid = true;
          }
        }
      }
    });

    expect(foundTestMesa).toBe(true);
    expect(foundUuid).toBe(true);
  });
});
