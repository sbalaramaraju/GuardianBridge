import { motion } from 'motion/react';
import { Incident } from '../types';

interface IncidentCardProps {
  incident: Incident;
  isSelected: boolean;
  onClick: () => void;
}

export function IncidentCard({ incident, isSelected, onClick }: IncidentCardProps) {
  const timestamp = incident.timestamp?.toDate ? incident.timestamp.toDate() : new Date();

  return (
    <motion.div
      layoutId={incident.id}
      onClick={onClick}
      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
        isSelected 
          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-900/10' 
          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
          incident.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
          'bg-zinc-500/20 text-zinc-400'
        }`}>
          {incident.severity}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{incident.type}</h3>
      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{incident.description}</p>
    </motion.div>
  );
}
