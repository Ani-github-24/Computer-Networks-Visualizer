
import type { PacketField } from './PacketInspector';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface SequenceActor {
  id: string;
  name: string;
  type?: string; 
}

export interface SequenceMessage<T = PacketField[]> {
  id: string;
  from: string; // Actor ID
  to: string;   // Actor ID
  label: string;
  stepIndex: number; // The logical time step this message occurs
  data?: T; 
  isError?: boolean; 
}

export interface SequenceDiagramProps<T = PacketField[]> {
  actors: SequenceActor[];
  messages: SequenceMessage<T>[];
  currentStep: number; 
  onMessageClick?: (message: SequenceMessage<T>) => void;
}

export function SequenceDiagram<T = PacketField[]>({
  actors,
  messages,
  currentStep,
  onMessageClick
}: SequenceDiagramProps<T>) {
  // Filter messages up to current step
  const visibleMessages = messages.filter(m => m.stepIndex <= currentStep);
  
  // Calculate vertical spacing
  const messageSpacing = 60;
  const headerHeight = 80;
  const totalHeight = headerHeight + (messages.length + 1) * messageSpacing;

  return (
    <div className="w-full overflow-x-auto bg-surface rounded-lg border border-border p-6 min-h-[400px]">
      <div className="relative min-w-[600px] w-full" style={{ height: `${totalHeight}px` }}>
        
        {/* Actors and Lifelines */}
        <div className="flex justify-between w-full relative z-10">
          {actors.map((actor) => (
            <div key={actor.id} className="flex flex-col items-center" style={{ width: '120px' }}>
              <div className="w-16 h-16 bg-surfaceHover border-2 border-primary rounded-lg flex items-center justify-center font-mono text-sm font-bold shadow-sm mb-2 text-text">
                {actor.name}
              </div>
              {actor.type && (
                <span className="text-xs text-textMuted uppercase font-mono tracking-widest">{actor.type}</span>
              )}
            </div>
          ))}
        </div>

        {/* Vertical Lines */}
        {actors.map((actor, idx) => {
          const percentX = (idx / (actors.length - 1)) * 100;
          return (
            <div
              key={`line-${actor.id}`}
              className="absolute top-[80px] bottom-0 border-l-2 border-dashed border-border z-0"
              style={{ left: `calc(${percentX}% + ${idx === 0 ? '60px' : idx === actors.length - 1 ? '-60px' : '0px'})` }}
            />
          );
        })}

        {/* Messages */}
        {visibleMessages.map((msg, idx) => {
          const fromIdx = actors.findIndex(a => a.id === msg.from);
          const toIdx = actors.findIndex(a => a.id === msg.to);
          
          if (fromIdx === -1 || toIdx === -1) return null;

          const isLeftToRight = fromIdx < toIdx;
          const leftPercent = (Math.min(fromIdx, toIdx) / (actors.length - 1)) * 100;
          const widthPercent = (Math.abs(fromIdx - toIdx) / (actors.length - 1)) * 100;
          
          const yPos = headerHeight + (idx + 1) * messageSpacing;
          
          // Adjust endpoints to attach to the center of lifelines
          const leftOffset = fromIdx === 0 || toIdx === 0 ? '60px' : '0px';
          const rightOffset = fromIdx === actors.length - 1 || toIdx === actors.length - 1 ? '-60px' : '0px';

          return (
            <div
              key={msg.id}
              className={`absolute flex flex-col justify-end pb-1 cursor-pointer group transition-opacity duration-300 ${
                msg.stepIndex === currentStep ? 'opacity-100' : 'opacity-70'
              }`}
              style={{
                top: `${yPos}px`,
                left: `calc(${leftPercent}% + ${leftOffset})`,
                width: `calc(${widthPercent}% + ${rightOffset})`,
                height: '30px'
              }}
              onClick={() => onMessageClick?.(msg)}
            >
              <span className={`text-xs font-mono mb-1 text-center group-hover:font-bold ${
                msg.isError ? 'text-error' : msg.stepIndex === currentStep ? 'text-primary' : 'text-textMuted'
              }`}>
                {msg.label}
              </span>
              
              <div className="relative w-full flex items-center">
                <div className={`w-full h-0.5 ${msg.isError ? 'bg-error' : 'bg-primary'}`} />
                
                {/* Arrow head */}
                <div 
                  className={`absolute w-3 h-3 ${msg.isError ? 'border-error' : 'border-primary'} transform rotate-45`}
                  style={{
                    borderTopWidth: isLeftToRight ? '2px' : '0',
                    borderRightWidth: isLeftToRight ? '2px' : '0',
                    borderBottomWidth: !isLeftToRight ? '2px' : '0',
                    borderLeftWidth: !isLeftToRight ? '2px' : '0',
                    right: isLeftToRight ? '-1px' : 'auto',
                    left: !isLeftToRight ? '-1px' : 'auto',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
