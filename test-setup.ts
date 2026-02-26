import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

// Mock GoogleGenAI globally to prevent initialization errors
mock.module('@google/genai', () => {
    return {
        GoogleGenAI: class {
            constructor() {}
            models = {
                generateContent: mock(() => Promise.resolve({ text: '{}' }))
            };
        },
        Type: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            ARRAY: 'ARRAY',
            INTEGER: 'INTEGER',
            BOOLEAN: 'BOOLEAN',
            NUMBER: 'NUMBER'
        }
    };
});

// Mock Recharts globally to avoid resizing issues in headless environment
mock.module('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    BarChart: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
    Bar: () => React.createElement('div'),
    XAxis: () => React.createElement('div'),
    YAxis: () => React.createElement('div'),
    CartesianGrid: () => React.createElement('div'),
    Tooltip: () => React.createElement('div'),
    PieChart: () => React.createElement('div', { 'data-testid': 'pie-chart' }),
    Pie: () => React.createElement('div'),
    Cell: () => React.createElement('div'),
  };
});

GlobalRegistrator.register();

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof URL.createObjectURL === 'undefined') {
  (URL.createObjectURL as any) = () => 'blob:mock-url';
  (URL.revokeObjectURL as any) = () => {};
} else {
    // In case it exists but needs overriding or just in case happy-dom updates
    const originalCreate = URL.createObjectURL;
    (URL.createObjectURL as any) = (obj: any) => 'blob:mock-url';
    (URL.revokeObjectURL as any) = () => {};
}

// Mock FileReader
class MockFileReader {
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    result: string | ArrayBuffer | null = null;
    readAsDataURL(blob: Blob) {
        this.result = 'data:image/png;base64,mock-base64-data';
        setTimeout(() => {
            if (this.onloadend) {
                this.onloadend({ target: { result: this.result } } as any);
            }
        }, 0);
    }
}
(global as any).FileReader = MockFileReader;


afterEach(() => {
    cleanup();
});
