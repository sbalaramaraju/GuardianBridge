import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IncidentList } from './IncidentList';
import { Incident } from '../types';

const mockIncidents: Incident[] = [
  {
    id: '1',
    type: 'Fire',
    description: 'Building fire on 5th Ave',
    severity: 'critical',
    location: { lat: 40.7128, lng: -74.0060 },
    status: 'reported',
    timestamp: { toDate: () => new Date('2026-03-20T10:00:00Z') } as any,
    reporterId: 'user1',
    actions: []
  },
  {
    id: '2',
    type: 'Flood',
    description: 'River overflow near Bridge St',
    severity: 'high',
    location: { lat: 40.7129, lng: -74.0061 },
    status: 'reported',
    timestamp: { toDate: () => new Date('2026-03-20T10:05:00Z') } as any,
    reporterId: 'user2',
    actions: []
  }
];

describe('IncidentList', () => {
  it('renders a list of incidents', () => {
    render(
      <IncidentList 
        incidents={mockIncidents} 
        loading={false} 
        onIncidentSelect={() => {}} 
      />
    );

    expect(screen.getByText('Fire')).toBeInTheDocument();
    expect(screen.getByText('Flood')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <IncidentList 
        incidents={[]} 
        loading={true} 
        onIncidentSelect={() => {}} 
      />
    );

    expect(screen.getByText('Connecting to response network...')).toBeInTheDocument();
  });

  it('shows empty state correctly', () => {
    render(
      <IncidentList 
        incidents={[]} 
        loading={false} 
        onIncidentSelect={() => {}} 
      />
    );

    expect(screen.getByText('No active incidents reported.')).toBeInTheDocument();
  });

  it('calls onIncidentSelect when an incident is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <IncidentList 
        incidents={mockIncidents} 
        loading={false} 
        onIncidentSelect={handleSelect} 
      />
    );

    fireEvent.click(screen.getByText('Fire'));
    expect(handleSelect).toHaveBeenCalledWith(mockIncidents[0]);
  });
});
