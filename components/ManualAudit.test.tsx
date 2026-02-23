import { describe, it, expect, mock, beforeEach } from 'bun:test';
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ManualAudit from './ManualAudit';
import { AnalyzedAct } from '../types';

// Mock Lucide icons
mock.module('lucide-react', () => ({
  Upload: () => <div data-testid="icon-upload" />,
  Camera: () => <div data-testid="icon-camera" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Check: () => <div data-testid="icon-check" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Microscope: () => <div data-testid="icon-microscope" />,
  Gavel: () => <div data-testid="icon-gavel" />,
  Scale: () => <div data-testid="icon-scale" />,
}));

// Mock Gemini Service
const mockAnalyze = mock(() => Promise.resolve({}));
mock.module('../services/geminiService', () => ({
  analyzeElectionAct: mockAnalyze,
}));

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  _onloadend: (() => void) | null = null;
  readCalled = false;

  set onloadend(callback: () => void) {
    this._onloadend = callback;
    if (this.readCalled) {
        setTimeout(() => callback(), 0);
    }
  }

  get onloadend() {
    return this._onloadend;
  }

  readAsDataURL() {
    this.result = 'data:image/png;base64,mockbase64';
    this.readCalled = true;
    if (this._onloadend) {
        setTimeout(() => this._onloadend!(), 0);
    }
  }
}
global.FileReader = MockFileReader as any;

describe('ManualAudit Component', () => {
  beforeEach(() => {
    mockAnalyze.mockClear();
    mockAnalyze.mockResolvedValue({});
  });

  it('renders initial state correctly', () => {
    const { getByText, getByTestId } = render(<ManualAudit />);

    expect(getByText('Upload E-14 Form')).toBeTruthy();
    expect(getByText('Select Image')).toBeTruthy();
    expect(getByText('No data extracted yet.')).toBeTruthy();

    const runButton = getByText('Run Audit').closest('button');
    expect((runButton as HTMLButtonElement).disabled).toBe(true);

    expect(getByTestId('icon-upload')).toBeTruthy();
  });

  it('handles file selection and shows preview', async () => {
    const { getByText, getByAltText, container } = render(<ManualAudit />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
        expect(getByAltText('Act Preview')).toBeTruthy();
    });

    const runButton = getByText('Run Audit').closest('button');
    expect((runButton as HTMLButtonElement).disabled).toBe(false);

    expect(getByText('✕')).toBeTruthy();
  });

  it('clears file and results on reset', async () => {
    const { getByText, queryByAltText, getByAltText, container } = render(<ManualAudit />);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
         expect(getByAltText('Act Preview')).toBeTruthy();
    });

    const closeBtn = getByText('✕');
    fireEvent.click(closeBtn);

    expect(queryByAltText('Act Preview')).toBeNull();
    expect(getByText('Upload E-14 Form')).toBeTruthy();
  });
});
