

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface PacketField {
  id: string;
  name: string;
  value: string | number;
  widthBits: number;
  description: string;
  isHighlight?: boolean;
}

export interface PacketInspectorProps {
  title?: string;
  fields: PacketField[]; 
  onFieldHover?: (field: PacketField | null) => void;
}

export function PacketInspector({ title = "Packet Inspector", fields, onFieldHover }: PacketInspectorProps) {
  const totalBits = fields.reduce((sum, f) => sum + f.widthBits, 0);

  return (
    <div className="bg-surface border border-border rounded overflow-hidden flex flex-col w-full max-w-3xl">
      <div className="bg-surfaceHover px-4 py-2 border-b border-border flex justify-between items-center">
        <h3 className="font-mono text-sm font-semibold text-text">{title}</h3>
        <span className="text-xs text-textMuted font-mono">{totalBits} bits</span>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="flex w-full min-w-[500px] border-2 border-border rounded">
          {fields.map((field) => {
            const percentage = (field.widthBits / totalBits) * 100;
            return (
              <div
                key={field.id}
                className={`flex flex-col border-r border-border last:border-r-0 group cursor-help transition-colors ${
                  field.isHighlight ? 'bg-accent/10' : 'hover:bg-surfaceHover'
                }`}
                style={{ width: `${Math.max(percentage, 5)}%`, flexGrow: percentage }}
                onMouseEnter={() => onFieldHover?.(field)}
                onMouseLeave={() => onFieldHover?.(null)}
              >
                <div className="text-[10px] text-textMuted text-center font-mono py-1 border-b border-border/50 bg-black/10 truncate px-1">
                  {field.name} ({field.widthBits}b)
                </div>
                <div className={`text-sm text-center font-mono py-3 truncate px-2 ${
                  field.isHighlight ? 'text-accent font-bold' : 'text-text'
                }`}>
                  {field.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
