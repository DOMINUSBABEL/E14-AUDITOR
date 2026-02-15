import { describe, it, expect, afterEach } from 'bun:test';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import LiveMonitor from './LiveMonitor';
import { SystemLog } from '../types';

describe('LiveMonitor Component', () => {
  const mockLogs: SystemLog[] = [
    { id: '1', timestamp: '10:00:00', message: 'Log 1', type: 'info', source: 'ClawdBot' },
    { id: '2', timestamp: '10:00:01', message: 'Log 2', type: 'error', source: 'Redis' },
    { id: '3', timestamp: '10:00:02', message: 'Log 3', type: 'success', source: 'GeminiWorker' },
    { id: '4', timestamp: '10:00:03', message: 'Log 4', type: 'warning', source: 'LegalEngine' },
  ];

  afterEach(() => {
    cleanup();
  });

  it('renders all logs initially', () => {
    const { getByText } = render(<LiveMonitor logs={mockLogs} />);
    expect(getByText('Log 1')).toBeTruthy();
    expect(getByText('Log 2')).toBeTruthy();
    expect(getByText('Log 3')).toBeTruthy();
    expect(getByText('Log 4')).toBeTruthy();
  });

  it('filters logs when a NodeCard is clicked', () => {
    const { getByText, queryByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click ClawdBot card
    const clawdBotCard = getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotCard);

    expect(getByText('Log 1')).toBeTruthy();
    expect(queryByText('Log 2')).toBeNull();
    expect(queryByText('Log 3')).toBeNull();
    expect(queryByText('Log 4')).toBeNull();
  });

  it('clears filter when the same NodeCard is clicked again', () => {
    const { getByText, queryByText } = render(<LiveMonitor logs={mockLogs} />);

    const clawdBotCard = getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotCard);

    // Verify filtered
    expect(queryByText('Log 2')).toBeNull();

    // Click again
    fireEvent.click(clawdBotCard);

    // Verify all logs back
    expect(getByText('Log 1')).toBeTruthy();
    expect(getByText('Log 2')).toBeTruthy();
  });

  it('filters logs when source in log entry is clicked', () => {
    const { getByText, queryByText, getAllByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click "ClawdBot:" in the log list
    const sourceLinks = getAllByText('ClawdBot:');
    fireEvent.click(sourceLinks[0]);

    expect(getByText('Log 1')).toBeTruthy();
    expect(queryByText('Log 2')).toBeNull();
  });

  it('clears filter when "Clear Filter" button is clicked', () => {
    const { getByText, queryByText, getAllByText } = render(<LiveMonitor logs={mockLogs} />);

    // Filter first
    const sourceLinks = getAllByText('ClawdBot:');
    fireEvent.click(sourceLinks[0]);

    expect(queryByText('Log 2')).toBeNull();

    // Find and click Clear Filter
    const clearButton = getByText('Clear Filter');
    fireEvent.click(clearButton);

    expect(getByText('Log 1')).toBeTruthy();
    expect(getByText('Log 2')).toBeTruthy();
  });

  it('shows no logs message when filter matches nothing', () => {
    // Create logs that DON'T include LegalEngine
    const logsWithoutLegalEngine: SystemLog[] = [
        { id: '1', timestamp: '10:00:00', message: 'Log 1', type: 'info', source: 'ClawdBot' },
    ];

    const { getByText, queryByText } = render(<LiveMonitor logs={logsWithoutLegalEngine} />);

    // Click LegalEngine card
    const legalEngineCard = getByText('Legal Engine');
    fireEvent.click(legalEngineCard);

    expect(getByText('No logs found for LegalEngine')).toBeTruthy();
    expect(queryByText('Log 1')).toBeNull();
  });
});
