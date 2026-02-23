import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import LiveMonitor from './LiveMonitor';
import { SystemLog } from '../types';

const mockLogs: SystemLog[] = [
  { id: '1', timestamp: '10:00:00', message: 'Log 1', type: 'info', source: 'ClawdBot' },
  { id: '2', timestamp: '10:00:01', message: 'Log 2', type: 'error', source: 'Redis' },
  { id: '3', timestamp: '10:00:02', message: 'Log 3', type: 'success', source: 'GeminiWorker' },
  { id: '4', timestamp: '10:00:03', message: 'Log 4', type: 'warning', source: 'LegalEngine' },
];

describe('LiveMonitor', () => {

  it('renders logs correctly', () => {
    render(<LiveMonitor logs={mockLogs} />);
    expect(screen.getByText('Log 1')).toBeTruthy();
    expect(screen.getByText('Log 2')).toBeTruthy();
    expect(screen.getByText('Log 3')).toBeTruthy();
    expect(screen.getByText('Log 4')).toBeTruthy();
    expect(screen.getByText('tail -f system.log')).toBeTruthy();
  });

  it('filters logs by clicking NodeCard', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Click on "WhatsApp (ClawdBot)" card
    const clawdBotCard = screen.getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotCard);

    // Verify only ClawdBot logs are visible
    expect(screen.getByText('Log 1')).toBeTruthy();
    expect(screen.queryByText('Log 2')).toBeNull();
    expect(screen.queryByText('Log 3')).toBeNull();
    expect(screen.queryByText('Log 4')).toBeNull();

    // Verify filter text
    expect(screen.getByText('filter: source == "ClawdBot"')).toBeTruthy();
  });

  it('filters logs by clicking log source', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Find the source text for Redis and click it
    // The source is rendered as "Redis:"
    const redisSource = screen.getAllByText('Redis:')[0];
    fireEvent.click(redisSource);

    // Verify only Redis logs are visible
    expect(screen.queryByText('Log 1')).toBeNull();
    expect(screen.getByText('Log 2')).toBeTruthy();
    expect(screen.queryByText('Log 3')).toBeNull();

    // Verify filter text
    expect(screen.getByText('filter: source == "Redis"')).toBeTruthy();
  });

  it('clears filter when clicking clear button', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Apply filter first
    const clawdBotCard = screen.getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotCard);

    expect(screen.queryByText('Log 2')).toBeNull();

    // Click Clear Filter
    const clearButton = screen.getByText('Clear Filter');
    fireEvent.click(clearButton);

    // Verify all logs are back
    expect(screen.getByText('Log 1')).toBeTruthy();
    expect(screen.getByText('Log 2')).toBeTruthy();
    expect(screen.getByText('Log 3')).toBeTruthy();
  });

  it('toggles filter when clicking the same NodeCard', () => {
    render(<LiveMonitor logs={mockLogs} />);

    const clawdBotCard = screen.getByText('WhatsApp (ClawdBot)');

    // First click to select
    fireEvent.click(clawdBotCard);
    expect(screen.queryByText('Log 2')).toBeNull();

    // Second click to deselect
    fireEvent.click(clawdBotCard);

    // Verify all logs are back
    expect(screen.getByText('Log 2')).toBeTruthy();
    expect(screen.getByText('tail -f system.log')).toBeTruthy();
  });

  it('shows empty state message', () => {
    render(<LiveMonitor logs={[]} />);
    expect(screen.getByText('Waiting for incoming signals...')).toBeTruthy();
  });

  it('shows specific empty state message when filtered', () => {
    // Render with logs that don't match the filter we're about to apply
    // But NodeCards are fixed, so let's use the mocked logs and filter for a source that has no logs in the mock?
    // The mock logs have ClawdBot, Redis, GeminiWorker, LegalEngine.
    // Let's create a custom log set without ClawdBot
    const noClawdBotLogs: SystemLog[] = [
        { id: '2', timestamp: '10:00:01', message: 'Log 2', type: 'error', source: 'Redis' },
    ];

    // We need to unmount the previous render or just use a fresh render in this test block (cleanup handles it)
    render(<LiveMonitor logs={noClawdBotLogs} />);

    const clawdBotCard = screen.getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotCard);

    expect(screen.getByText('No logs found for ClawdBot')).toBeTruthy();
    expect(screen.queryByText('Log 2')).toBeNull();
  });
});
