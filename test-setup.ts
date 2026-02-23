import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, mock } from 'bun:test';
import React from 'react';

// Register Happy DOM globals before anything else
GlobalRegistrator.register();

// Set dummy API key for testing
process.env.API_KEY = 'dummy-key-for-testing';

// Helper to create a simple icon component
const createIcon = (name: string) => () => React.createElement('div', { 'data-testid': `icon-${name.toLowerCase()}` });

// Mock lucide-react globally with all used icons
mock.module('lucide-react', () => ({
  Upload: createIcon('upload'),
  Camera: createIcon('camera'),
  FileText: createIcon('file-text'),
  Check: createIcon('check'),
  AlertTriangle: createIcon('alert-triangle'),
  Loader2: createIcon('loader2'),
  Microscope: createIcon('microscope'),
  Gavel: createIcon('gavel'),
  Scale: createIcon('scale'),
  Database: createIcon('database'),
  Server: createIcon('server'),
  Cpu: createIcon('cpu'),
  MessageSquare: createIcon('message-square'),
  ArrowRight: createIcon('arrow-right'),
  FilterX: createIcon('filter-x'),
  ShieldCheck: createIcon('shield-check'),
  Activity: createIcon('activity'),
  Download: createIcon('download'),
  Search: createIcon('search'),
  Calendar: createIcon('calendar'),
  Filter: createIcon('filter'),
  FileSpreadsheet: createIcon('file-spreadsheet'),
  X: createIcon('x'),
  CheckCircle: createIcon('check-circle'),
  Clock: createIcon('clock'),
  Bell: createIcon('bell'),
  Settings: createIcon('settings'),
  Mail: createIcon('mail'),
  ChartColumn: createIcon('chart-column'),
  BrainCircuit: createIcon('brain-circuit')
}));

// Dynamically import cleanup to avoid hoisting issues
// This ensures Happy DOM is set up before Testing Library initializes
const { cleanup } = await import('@testing-library/react');

afterEach(() => {
    cleanup();
});
