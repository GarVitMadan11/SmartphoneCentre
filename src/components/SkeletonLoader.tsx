import React from 'react';

export const ModelSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-canvas-white border border-ice-border/40 rounded-lg p-5 flex flex-col justify-between animate-pulse space-y-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 pr-3">
              <div className="h-4 bg-zinc-700/40 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-800/40 rounded w-1/2"></div>
            </div>
            <div className="w-16 h-16 bg-zinc-800/50 rounded-lg flex-shrink-0"></div>
          </div>
          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <div className="h-5 bg-cobalt/20 rounded w-24"></div>
            <div className="h-8 bg-zinc-700/50 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
