import { describe, it, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Sidebar from './Sidebar';
import { NAV_ITEMS } from '../constants';

describe('Sidebar Component', () => {
  const mockSetActiveTab = mock((id: string) => {});
  const defaultProps = {
    activeTab: 'dashboard',
    setActiveTab: mockSetActiveTab,
  };

  it('renders the sidebar title and version', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('AUDITOR')).toBeInTheDocument();
    expect(screen.getByText('.AI')).toBeInTheDocument();
    expect(screen.getByText('v2.0 Ryzen Core')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar {...defaultProps} />);

    NAV_ITEMS.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('highlights the active tab', () => {
    const activeTab = NAV_ITEMS[0].id; // dashboard
    render(<Sidebar {...defaultProps} activeTab={activeTab} />);

    const activeIcon = screen.getByText(NAV_ITEMS[0].label).closest('button');
    expect(activeIcon).toHaveClass('bg-primary-600/10');
    expect(activeIcon).toHaveClass('text-primary-500');
  });

  it('does not highlight inactive tabs', () => {
    const activeTab = NAV_ITEMS[0].id;
    const inactiveTab = NAV_ITEMS[1].id;
    render(<Sidebar {...defaultProps} activeTab={activeTab} />);

    const inactiveIcon = screen.getByText(NAV_ITEMS[1].label).closest('button');
    expect(inactiveIcon).not.toHaveClass('bg-primary-600/10');
    expect(inactiveIcon).toHaveClass('text-slate-400');
  });

  it('calls setActiveTab when a navigation item is clicked', () => {
    const setActiveTab = mock((id: string) => {});
    render(<Sidebar {...defaultProps} setActiveTab={setActiveTab} />);

    const secondItem = NAV_ITEMS[1];
    fireEvent.click(screen.getByText(secondItem.label));

    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith(secondItem.id);
  });

  it('renders system metrics', () => {
    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('SYSTEM ONLINE')).toBeInTheDocument();
    expect(screen.getByText(/CPU \(Ryzen 9\)/)).toBeInTheDocument();
    expect(screen.getByText('84%')).toBeInTheDocument();
    expect(screen.getByText(/RAM \(16GB\)/)).toBeInTheDocument();
    expect(screen.getByText('14.8GB')).toBeInTheDocument();
  });
});
