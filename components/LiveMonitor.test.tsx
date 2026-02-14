import { describe, test, expect, afterEach } from 'bun:test';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';
import LiveMonitor from './LiveMonitor';
import { SystemLog } from '../types';

afterEach(cleanup);

describe('LiveMonitor', () => {
  const mockLogs: SystemLog[] = [
    {
      id: '1',
      timestamp: '2023-10-27 10:00:00',
      message: 'Incoming message from +1234567890',
      type: 'info',
      source: 'ClawdBot',
    },
    {
      id: '2',
      timestamp: '2023-10-27 10:00:01',
      message: 'Processing job #123',
      type: 'info',
      source: 'GeminiWorker',
    },
    {
      id: '3',
      timestamp: '2023-10-27 10:00:02',
      message: 'Error connecting to database',
      type: 'error',
      source: 'Redis',
    },
  ];

  test('renders without crashing and displays architecture nodes', () => {
    render(<LiveMonitor logs={[]} />);

    expect(screen.getByText('WhatsApp (ClawdBot)')).toBeDefined();
    expect(screen.getByText('Redis Queue')).toBeDefined();
    expect(screen.getByText('Gemini Worker')).toBeDefined();
    expect(screen.getByText('Legal Engine')).toBeDefined();
    expect(screen.getByText('Waiting for incoming signals...')).toBeDefined();
  });

  test('displays logs passed as props', () => {
    render(<LiveMonitor logs={mockLogs} />);

    expect(screen.getByText('Incoming message from +1234567890')).toBeDefined();
    expect(screen.getByText('Processing job #123')).toBeDefined();
    expect(screen.getByText('Error connecting to database')).toBeDefined();
  });

  test('filters logs when a node is clicked', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Click on ClawdBot node
    const clawdBotNode = screen.getByText('WhatsApp (ClawdBot)');
    fireEvent.click(clawdBotNode);

    // Should show ClawdBot logs
    expect(screen.getByText('Incoming message from +1234567890')).toBeDefined();

    // Should NOT show GeminiWorker logs
    // queryByText returns null if not found
    expect(screen.queryByText('Processing job #123')).toBeNull();

    // Should show filter indicator
    expect(screen.getByText('filter: source == "ClawdBot"')).toBeDefined();
  });

  test('clears filter when "Clear Filter" is clicked', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Set filter
    fireEvent.click(screen.getByText('WhatsApp (ClawdBot)'));
    expect(screen.queryByText('Processing job #123')).toBeNull();

    // Clear filter
    const clearButton = screen.getByText('Clear Filter');
    fireEvent.click(clearButton);

    // Should show all logs again
    expect(screen.getByText('Processing job #123')).toBeDefined();
    expect(screen.getByText('tail -f system.log')).toBeDefined();
  });

  test('displays empty state message when no logs match filter', () => {
    render(<LiveMonitor logs={mockLogs} />);

    // Click on Legal Engine (no logs in mockLogs)
    fireEvent.click(screen.getByText('Legal Engine'));

    expect(screen.getByText('No logs found for LegalEngine')).toBeDefined();
  });
});
