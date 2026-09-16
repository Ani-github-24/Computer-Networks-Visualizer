import React from 'react';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface TableColumn {
  key: string;
  header: string;
}

export interface LiveTableRow {
  id: string; // stable identity, not array index
  cells: Record<string, React.ReactNode>;
}

export interface LiveTableProps {
  title?: string;
  columns: TableColumn[];
  data: LiveTableRow[];
  // Keyed by row.id
  rowStates?: Record<string, 'added' | 'updated' | 'removed' | 'none'>; 
}

export function LiveTable({ title, columns, data, rowStates = {} }: LiveTableProps) {
  
  const getRowClass = (state: string | undefined) => {
    switch (state) {
      case 'added':
        return 'bg-success/20 border-l-4 border-success animate-pulse-once';
      case 'updated':
        return 'bg-warning/20 border-l-4 border-warning';
      case 'removed':
        return 'bg-error/10 opacity-50 line-through border-l-4 border-error';
      default:
        return 'border-l-4 border-transparent hover:bg-surfaceHover/50';
    }
  };

  return (
    <div className="w-full flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
      {title && (
        <div className="bg-surfaceHover px-4 py-3 border-b border-border">
          <h3 className="font-mono font-bold text-sm text-text">{title}</h3>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background border-b border-border text-xs uppercase tracking-wider text-textMuted font-mono">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm font-mono divide-y divide-border/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-textMuted italic">
                  Table is empty
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const state = rowStates[row.id] || 'none';
                return (
                  <tr key={row.id} className={`transition-colors duration-300 ${getRowClass(state)}`}>
                    {columns.map((col) => (
                      <td key={`${row.id}-${col.key}`} className="px-4 py-3 whitespace-nowrap text-text">
                        {row.cells[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
