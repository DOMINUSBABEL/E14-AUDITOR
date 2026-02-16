import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import React from 'react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';
process.env.GEMINI_API_KEY = 'dummy-gemini-key';

// Mock GoogleGenAI globally to prevent initialization errors
mock.module('@google/genai', () => {
    return {
        GoogleGenAI: class {
            constructor() {}
            getGenerativeModel() {
                return {
                    generateContent: async () => ({
                        response: { text: () => "Mocked response" }
                    })
                };
            }
        },
        Type: {
            STRING: 'STRING',
            NUMBER: 'NUMBER',
            INTEGER: 'INTEGER',
            BOOLEAN: 'BOOLEAN',
            ARRAY: 'ARRAY',
            OBJECT: 'OBJECT'
        }
    };
});

// Mock Recharts globally
mock.module('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    PieChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    Pie: ({ children }: any) => React.createElement('div', { 'data-testid': 'pie' }, children),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  };
});

GlobalRegistrator.register();

// Dynamically import cleanup to ensure GlobalRegistrator is registered first
const { cleanup } = await import('@testing-library/react');

afterEach(() => {
    cleanup();
});
