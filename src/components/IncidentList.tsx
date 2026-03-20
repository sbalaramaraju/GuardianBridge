import { motion } from 'motion/react';
import { Activity, CheckCircle } from 'lucide-react';
import { Incident } from '../types';
import { IncidentCard } from './IncidentCard';

interface IncidentListProps {
  incidents: Incident[];
  loading: boolean;
  selectedIncidentId?: string;
  onIncidentSelect: (incident: Incident) => void;
}

export function IncidentList({ incidents, loading, selectedIncidentId, onIncidentSelect }: IncidentListProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      aria-live="polite"
      aria-atomic="false"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
          <Activity className="w-8 h-8 animate-pulse" aria-hidden="true" />
          <p className="text-xs">Connecting to response network...</p>
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 text-zinc-600">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
          <p className="text-sm">No active incidents reported.</p>
        </div>
      ) : (
        incidents.map((incident) => (
          <IncidentCard 
            key={incident.id}
            incident={incident}
            isSelected={selectedIncidentId === incident.id}
            onClick={() => onIncidentSelect(incident)}
          />
        ))
      )}
    </div>
  );
}
