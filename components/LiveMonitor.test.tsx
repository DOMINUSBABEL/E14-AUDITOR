import { describe, it, expect, afterEach } from 'bun:test';
import React from 'react';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import LiveMonitor from './LiveMonitor';
import { SystemLog } from '../types';

describe('LiveMonitor', () => {
    afterEach(cleanup);

    const logs: SystemLog[] = [
        { id: '1', timestamp: '10:00', message: 'Log 1', type: 'info', source: 'ClawdBot' },
        { id: '2', timestamp: '10:01', message: 'Log 2', type: 'error', source: 'Redis' }
    ];

    it('renders node cards and logs', () => {
        render(<LiveMonitor logs={logs} />);
        expect(screen.getByText('WhatsApp (ClawdBot)')).toBeTruthy();
        expect(screen.getByText('Redis Queue')).toBeTruthy();
        expect(screen.getByText('Log 1')).toBeTruthy();
        expect(screen.getByText('Log 2')).toBeTruthy();
    });

    it('filters logs when a node card is clicked', () => {
        render(<LiveMonitor logs={logs} />);

        // Click on ClawdBot node
        const nodeCardTitle = screen.getByText('WhatsApp (ClawdBot)');
        fireEvent.click(nodeCardTitle);

        // Verify filter behavior
        // Log 1 (ClawdBot) should be visible
        expect(screen.getByText('Log 1')).toBeTruthy();

        // Log 2 (Redis) should NOT be visible.
        expect(screen.queryByText('Log 2')).toBeNull();
    });
});
