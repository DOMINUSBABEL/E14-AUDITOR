import { describe, it, expect, jest, mock } from 'bun:test';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import { NAV_ITEMS } from '../constants';

// Mock lucide-react icons
mock.module('lucide-react', () => ({
  ShieldCheck: () => <div data-testid="icon-shield-check" />,
  Activity: () => <div data-testid="icon-activity" />,
  ChartColumn: () => <div data-testid="icon-chart-column" />,
  Server: () => <div data-testid="icon-server" />,
  Database: () => <div data-testid="icon-database" />,
  BrainCircuit: () => <div data-testid="icon-brain-circuit" />,
  Scale: () => <div data-testid="icon-scale" />,
}));

describe('Sidebar Component', () => {
  const mockSetActiveTab = jest.fn();

  it('renders all navigation items correctly', () => {
    const { getByText } = render(
      <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
    );

    NAV_ITEMS.forEach((item) => {
      expect(getByText(item.label)).toBeTruthy();
    });
  });

  it('highlights the active tab', () => {
    const activeTabId = NAV_ITEMS[0].id; // dashboard
    const { getByText } = render(
      <Sidebar activeTab={activeTabId} setActiveTab={mockSetActiveTab} />
    );

    const activeItem = getByText(NAV_ITEMS[0].label).closest('button');
    expect(activeItem?.className).toContain('bg-primary-600/10');
    expect(activeItem?.className).toContain('text-primary-500');
  });

  it('does not highlight inactive tabs', () => {
    const activeTabId = NAV_ITEMS[0].id; // dashboard
    const inactiveTabId = NAV_ITEMS[1].id; // live
    const { getByText } = render(
      <Sidebar activeTab={activeTabId} setActiveTab={mockSetActiveTab} />
    );

    const inactiveItem = getByText(NAV_ITEMS[1].label).closest('button');
    expect(inactiveItem?.className).toContain('text-slate-400');
    expect(inactiveItem?.className).not.toContain('bg-primary-600/10');
  });

  it('calls setActiveTab when a navigation item is clicked', () => {
    const { getByText } = render(
      <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
    );

    const targetItem = NAV_ITEMS[1]; // live
    fireEvent.click(getByText(targetItem.label));

    expect(mockSetActiveTab).toHaveBeenCalledWith(targetItem.id);
  });

  it('renders system status information', () => {
    const { getByText } = render(
      <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
    );

    expect(getByText('SYSTEM ONLINE')).toBeTruthy();
    expect(getByText('CPU (Ryzen 9)')).toBeTruthy();
    expect(getByText('RAM (16GB)')).toBeTruthy();
  });
});
