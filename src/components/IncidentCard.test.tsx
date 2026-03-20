import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IncidentCard } from './IncidentCard';
import { Incident } from '../types';

const mockIncident: Incident = {
  id: '1',
  type: 'Fire',
  description: 'Building fire on 5th Ave',
  severity: 'critical',
  location: { lat: 40.7128, lng: -74.0060 },
  status: 'reported',
  timestamp: { toDate: () => new Date('2026-03-20T10:00:00Z') } as any,
  reporterId: 'user1',
  actions: []
};

describe('IncidentCard', () => {
  it('renders incident details correctly', () => {
    render(
      <IncidentCard 
        incident={mockIncident} 
        isSelected={false} 
        onClick={() => {}} 
      />
    );

    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Building fire on 5th Ave')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <IncidentCard 
        incident={mockIncident} 
        isSelected={false} 
        onClick={handleClick} 
      />
    );

    fireEvent.click(screen.getByText('Fire'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    const { container } = render(
      <IncidentCard 
        incident={mockIncident} 
        isSelected={true} 
        onClick={() => {}} 
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('bg-emerald-500/10');
  });
});
