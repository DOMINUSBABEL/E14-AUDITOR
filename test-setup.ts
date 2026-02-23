import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import React from 'react';

// Register globals first!
GlobalRegistrator.register();

import { cleanup } from '@testing-library/react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

// Mock Recharts globally
mock.module('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
  BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
  Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
  XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
  YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
  CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
  Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
  PieChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
  Pie: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie' }, children),
  Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
}));

afterEach(() => {
    cleanup();
});
