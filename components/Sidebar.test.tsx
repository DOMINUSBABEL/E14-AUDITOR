import { describe, it, expect, mock, afterEach } from 'bun:test';
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Sidebar from './Sidebar';
import { NAV_ITEMS } from '../constants';

afterEach(() => {
  cleanup();
});

describe('Sidebar Component', () => {
  it('should call setActiveTab when a navigation item is clicked', () => {
    const setActiveTab = mock();
    const { getByText } = render(<Sidebar activeTab="dashboard" setActiveTab={setActiveTab} />);

    // Find the button for 'live' tab (Architecture & Logs)
    const liveTabLabel = NAV_ITEMS.find(item => item.id === 'live')?.label;
    if (!liveTabLabel) throw new Error('Live tab label not found');

    const button = getByText(liveTabLabel);
    fireEvent.click(button);

    expect(setActiveTab).toHaveBeenCalledWith('live');
  });

  it('should apply active styles to the selected tab', () => {
    // Render with 'audit' active
    const { getByText } = render(<Sidebar activeTab="audit" setActiveTab={() => {}} />);

    const auditTabLabel = NAV_ITEMS.find(item => item.id === 'audit')?.label;
    if (!auditTabLabel) throw new Error('Audit tab label not found');

    const dashboardTabLabel = NAV_ITEMS.find(item => item.id === 'dashboard')?.label;
    if (!dashboardTabLabel) throw new Error('Dashboard tab label not found');

    const activeBtn = getByText(auditTabLabel).closest('button');
    const inactiveBtn = getByText(dashboardTabLabel).closest('button');

    // Check for class 'bg-primary-600/10'
    expect(activeBtn?.className).toContain('bg-primary-600/10');
    expect(inactiveBtn?.className).not.toContain('bg-primary-600/10');
  });
});
