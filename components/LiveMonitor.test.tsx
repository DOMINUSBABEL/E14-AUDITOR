import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LiveMonitor, { NodeCard } from './LiveMonitor';
import { SystemLog } from '../types';

// Mock lucide-react icons
mock.module('lucide-react', () => ({
  MessageSquare: () => <div data-testid="icon-message-square" />,
  Database: () => <div data-testid="icon-database" />,
  Cpu: () => <div data-testid="icon-cpu" />,
  Server: () => <div data-testid="icon-server" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  FilterX: () => <div data-testid="icon-filter-x" />,
}));

const mockLogs: SystemLog[] = [
  { id: '1', timestamp: '10:00:00', source: 'ClawdBot', message: 'Message 1', type: 'info' },
  { id: '2', timestamp: '10:00:01', source: 'Redis', message: 'Message 2', type: 'warning' },
  { id: '3', timestamp: '10:00:02', source: 'GeminiWorker', message: 'Message 3', type: 'success' },
];

describe('LiveMonitor Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all logs initially', () => {
    const { getByText } = render(<LiveMonitor logs={mockLogs} />);
    expect(getByText('Message 1')).toBeTruthy();
    expect(getByText('Message 2')).toBeTruthy();
    expect(getByText('Message 3')).toBeTruthy();
    expect(getByText('tail -f system.log')).toBeTruthy();
  });

  it('filters logs when a NodeCard is clicked', () => {
    const { getByText, queryByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click on ClawdBot node
    fireEvent.click(getByText('WhatsApp (ClawdBot)'));

    expect(getByText('Message 1')).toBeTruthy();
    expect(queryByText('Message 2')).toBeNull();
    expect(queryByText('Message 3')).toBeNull();
    expect(getByText('filter: source == "ClawdBot"')).toBeTruthy();
  });

  it('clears filter when the same NodeCard is clicked again', () => {
    const { getByText, queryByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click on ClawdBot node to filter
    fireEvent.click(getByText('WhatsApp (ClawdBot)'));
    expect(queryByText('Message 2')).toBeNull();

    // Click again to clear
    fireEvent.click(getByText('WhatsApp (ClawdBot)'));

    expect(getByText('Message 1')).toBeTruthy();
    expect(getByText('Message 2')).toBeTruthy();
    expect(getByText('Message 3')).toBeTruthy();
    expect(getByText('tail -f system.log')).toBeTruthy();
  });

  it('clears filter when "Clear Filter" button is clicked', () => {
    const { getByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click on ClawdBot node to filter
    fireEvent.click(getByText('WhatsApp (ClawdBot)'));

    // Find and click Clear Filter button
    fireEvent.click(getByText('Clear Filter'));

    expect(getByText('Message 1')).toBeTruthy();
    expect(getByText('Message 2')).toBeTruthy();
    expect(getByText('Message 3')).toBeTruthy();
    expect(getByText('tail -f system.log')).toBeTruthy();
  });

  it('shows "No logs found" message when filter yields no results', () => {
    const { getByText, queryByText } = render(<LiveMonitor logs={mockLogs} />);

    // Click on LegalEngine node (which has no logs in mockLogs)
    fireEvent.click(getByText('Legal Engine'));

    expect(getByText('No logs found for LegalEngine')).toBeTruthy();
    expect(queryByText('Message 1')).toBeNull();
  });
});

describe('NodeCard Memoization', () => {
  it('should be wrapped in React.memo', () => {
    // React.memo components have a $$typeof property equal to Symbol.for('react.memo')
    // @ts-ignore - $$typeof is internal to React
    expect(NodeCard.$$typeof).toBe(Symbol.for('react.memo'));
  });
});
