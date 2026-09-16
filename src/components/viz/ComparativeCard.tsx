import React from 'react';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface ComparativeRow {
  feature: string;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
}

export interface ComparativeCardProps {
  titleA: string;
  titleB: string;
  rows: ComparativeRow[];
}

export function ComparativeCard({ titleA, titleB, rows }: ComparativeCardProps) {
  return (
    <div className="w-full bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="grid grid-cols-3 bg-surfaceHover border-b border-border font-mono font-bold text-sm">
        <div className="p-4 text-textMuted uppercase tracking-wider">Feature</div>
        <div className="p-4 text-primary border-l border-border">{titleA}</div>
        <div className="p-4 text-success border-l border-border">{titleB}</div>
      </div>
      
      <div className="flex flex-col">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-3 border-b border-border/50 last:border-b-0 hover:bg-surfaceHover/30 transition-colors">
            <div className="p-4 font-medium text-textMuted flex items-center">
              {row.feature}
            </div>
            <div className="p-4 border-l border-border/50 text-text">
              {row.valueA}
            </div>
            <div className="p-4 border-l border-border/50 text-text">
              {row.valueB}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
