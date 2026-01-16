
import React from 'react';
import { RAGStep, AgentRole } from '../types';
import { ICONS } from '../constants';

interface StepCardProps {
  step: RAGStep;
  isLast: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, isLast }) => {
  const getIcon = (role: AgentRole) => {
    switch (role) {
      case AgentRole.SAFETY: return ICONS.SAFETY;
      case AgentRole.MAKER: return ICONS.MAKER;
      case AgentRole.CHECKER: return ICONS.CHECKER;
      default: return ICONS.DATABASE;
    }
  };

  const getBg = (role: AgentRole) => {
    switch (role) {
      case AgentRole.SAFETY: return 'border-emerald-500/30 bg-emerald-500/5';
      case AgentRole.MAKER: return 'border-blue-500/30 bg-blue-500/5';
      case AgentRole.CHECKER: return 'border-purple-500/30 bg-purple-500/5';
      default: return 'border-slate-500/30 bg-slate-500/5';
    }
  };

  return (
    <div className="relative pl-8 pb-8">
      {!isLast && <div className="absolute left-[15px] top-[30px] bottom-0 w-0.5 bg-slate-700"></div>}
      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center z-10">
        {getIcon(step.role)}
      </div>
      <div className={`rounded-xl border p-4 transition-all duration-300 ${getBg(step.role)}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {step.role}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(step.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
          {step.content}
        </div>
        {step.metadata && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
            {Object.entries(step.metadata).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700">
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepCard;
