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

// Mock lucide-react icons
mock.module('lucide-react', () => ({
  // LiveMonitor
  MessageSquare: () => React.createElement('div', { 'data-testid': 'icon-message-square' }),
  Database: () => React.createElement('div', { 'data-testid': 'icon-database' }),
  Cpu: () => React.createElement('div', { 'data-testid': 'icon-cpu' }),
  Server: () => React.createElement('div', { 'data-testid': 'icon-server' }),
  ArrowRight: () => React.createElement('div', { 'data-testid': 'icon-arrow-right' }),
  FilterX: () => React.createElement('div', { 'data-testid': 'icon-filter-x' }),

  // ManualAudit
  Upload: () => React.createElement('div', { 'data-testid': 'icon-upload' }),
  Camera: () => React.createElement('div', { 'data-testid': 'icon-camera' }),
  FileText: () => React.createElement('div', { 'data-testid': 'icon-file-text' }),
  Check: () => React.createElement('div', { 'data-testid': 'icon-check' }),
  AlertTriangle: () => React.createElement('div', { 'data-testid': 'icon-alert-triangle' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'icon-loader2' }),
  Microscope: () => React.createElement('div', { 'data-testid': 'icon-microscope' }),
  Gavel: () => React.createElement('div', { 'data-testid': 'icon-gavel' }),
  Scale: () => React.createElement('div', { 'data-testid': 'icon-scale' }),

  // Sidebar
  ShieldCheck: () => React.createElement('div', { 'data-testid': 'icon-shield-check' }),
  Activity: () => React.createElement('div', { 'data-testid': 'icon-activity' }),

  // DataLake
  Download: () => React.createElement('div', { 'data-testid': 'icon-download' }),
  Search: () => React.createElement('div', { 'data-testid': 'icon-search' }),
  Calendar: () => React.createElement('div', { 'data-testid': 'icon-calendar' }),
  Filter: () => React.createElement('div', { 'data-testid': 'icon-filter' }),
  FileSpreadsheet: () => React.createElement('div', { 'data-testid': 'icon-file-spreadsheet' }),
  X: () => React.createElement('div', { 'data-testid': 'icon-x' }),

  // Dashboard
  CheckCircle: () => React.createElement('div', { 'data-testid': 'icon-check-circle' }),
  Clock: () => React.createElement('div', { 'data-testid': 'icon-clock' }),
  Bell: () => React.createElement('div', { 'data-testid': 'icon-bell' }),
  Settings: () => React.createElement('div', { 'data-testid': 'icon-settings' }),
  Mail: () => React.createElement('div', { 'data-testid': 'icon-mail' }),

  // constants.ts
  ChartColumn: () => React.createElement('div', { 'data-testid': 'icon-chart-column' }),
  BrainCircuit: () => React.createElement('div', { 'data-testid': 'icon-brain-circuit' }),
}));


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

afterEach(() => {
    cleanup();
});
