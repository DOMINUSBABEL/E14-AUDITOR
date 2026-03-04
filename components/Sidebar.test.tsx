import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, mock } from 'bun:test';

// Mock lucide-react icons used in Sidebar and constants
mock.module('lucide-react', () => {
  return {
    ShieldCheck: () => React.createElement('div', { 'data-testid': 'icon-shield-check' }),
    Activity: () => React.createElement('div', { 'data-testid': 'icon-activity' }),
    ChartColumn: () => React.createElement('div', { 'data-testid': 'icon-chart-column' }),
    Server: () => React.createElement('div', { 'data-testid': 'icon-server' }),
    Database: () => React.createElement('div', { 'data-testid': 'icon-database' }),
    BrainCircuit: () => React.createElement('div', { 'data-testid': 'icon-brain-circuit' }),
    Scale: () => React.createElement('div', { 'data-testid': 'icon-scale' }),
  };
});

import Sidebar from './Sidebar';
import { NAV_ITEMS } from '../constants';

describe('Sidebar Component', () => {
  it('renders correctly with the active tab', () => {
    const setActiveTabMock = mock();
    const activeTabId = NAV_ITEMS[0].id;

    const { getByText } = render(
      <Sidebar activeTab={activeTabId} setActiveTab={setActiveTabMock} />
    );

    // Verify all nav items are rendered
    NAV_ITEMS.forEach(item => {
      expect(getByText(item.label)).toBeTruthy();
    });

    // Check system info is rendered
    expect(getByText('SYSTEM ONLINE')).toBeTruthy();
    expect(getByText('CPU (Ryzen 9)')).toBeTruthy();
    expect(getByText('RAM (16GB)')).toBeTruthy();
  });

  it('calls setActiveTab when a navigation button is clicked', () => {
    const setActiveTabMock = mock();
    const { getByText } = render(
      <Sidebar activeTab={NAV_ITEMS[0].id} setActiveTab={setActiveTabMock} />
    );

    // Click on the second nav item
    const secondTab = NAV_ITEMS[1];
    fireEvent.click(getByText(secondTab.label));

    // Verify setActiveTab was called with the correct id
    expect(setActiveTabMock).toHaveBeenCalledWith(secondTab.id);
    expect(setActiveTabMock).toHaveBeenCalledTimes(1);
  });

  it('applies the correct active styling to the active tab', () => {
    const setActiveTabMock = mock();
    const activeTab = NAV_ITEMS[0];
    const inactiveTab = NAV_ITEMS[1];

    const { getByText } = render(
      <Sidebar activeTab={activeTab.id} setActiveTab={setActiveTabMock} />
    );

    const activeButton = getByText(activeTab.label).closest('button');
    const inactiveButton = getByText(inactiveTab.label).closest('button');

    // activeButton should contain the 'text-primary-500' class
    expect(activeButton?.className).toContain('text-primary-500');
    expect(activeButton?.className).toContain('bg-primary-600/10');

    // inactiveButton should contain the 'text-slate-400' class
    expect(inactiveButton?.className).toContain('text-slate-400');
    expect(inactiveButton?.className).not.toContain('text-primary-500');
  });
});
