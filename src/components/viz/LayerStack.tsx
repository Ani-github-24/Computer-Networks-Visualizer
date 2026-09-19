
import type { PacketField } from './PacketInspector';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface LayerData {
  id: 'application' | 'transport' | 'network' | 'link' | 'physical';
  name: string;
  headerFields?: PacketField[];
}

export interface LayerStackProps {
  layers: LayerData[];
  payloadData: string;
  phase: 'sender' | 'router-partial' | 'receiver';
  activeLayerId: string; 
  currentStep: number;
  onHeaderClick?: (layer: LayerData) => void;
}

export function LayerStack({
  layers,
  payloadData,
  phase,
  activeLayerId,
  onHeaderClick
}: LayerStackProps) {
  
  // A standard color mapping for OSI/TCP-IP layers
  const layerColors: Record<string, string> = {
    'application': 'bg-surfaceHover border-border text-text',
    'transport': 'bg-surfaceHover border-border text-text',
    'network': 'bg-accent/10 border-accent/30 text-accent',
    'link': 'bg-surfaceHover border-border text-text',
    'physical': 'bg-surfaceHover border-border text-text'
  };

  // Determine if a layer should render a header blob currently
  const hasHeader = (layerId: string) => {
    const idx = layers.findIndex(l => l.id === layerId);
    const activeIdx = layers.findIndex(l => l.id === activeLayerId);
    
    if (phase === 'sender') {
      // Sender adds headers as it goes down
      return idx <= activeIdx;
    } else if (phase === 'receiver') {
      // Receiver strips headers as it goes up
      return idx >= activeIdx;
    } else if (phase === 'router-partial') {
      // Router strips link, keeps network+ above
      if (layerId === 'physical' || layerId === 'link') return idx >= activeIdx;
      return true; // Transport and application headers remain intact
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-lg border border-border min-h-[500px]">
      
      {/* Title */}
      <h3 className="font-mono text-textMuted uppercase tracking-widest mb-8">
        {phase === 'sender' ? 'Encapsulation (Sender)' : phase === 'receiver' ? 'Decapsulation (Receiver)' : 'Router Processing'}
      </h3>

      <div className="flex gap-12 items-end">
        
        {/* The Stack */}
        <div className="flex flex-col gap-2 w-48">
          {layers.map((layer) => {
            const isActive = layer.id === activeLayerId;
            const colors = layerColors[layer.id] || layerColors['physical'];
            
            return (
              <div
                key={layer.id}
                className={`flex items-center justify-center p-3 rounded border-2 font-mono font-bold transition-all duration-300 ${colors} ${
                  isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-105' : 'opacity-70'
                }`}
              >
                {layer.name}
              </div>
            );
          })}
        </div>

        {/* The Packet Assembly Area */}
        <div className="flex flex-col gap-1 items-center pb-3">
          <div className="text-xs font-mono text-textMuted mb-2">Current Frame/Packet</div>
          <div className="flex items-stretch border-2 border-border rounded-lg overflow-hidden h-16 min-w-[200px] bg-background">
            
            {/* Headers (rendered left-to-right means outer-to-inner, but visually we stack them) */}
            {/* Physical doesn't usually add a standard visible "header" in the same way, but keeping it generic */}
            {layers.slice().reverse().map((layer) => {
              if (!hasHeader(layer.id) || layer.id === 'physical') return null;
              
              const colors = layerColors[layer.id];
              return (
                <div 
                  key={`hdr-${layer.id}`}
                  className={`flex items-center justify-center px-3 border-r border-background/50 cursor-pointer hover:brightness-125 transition-all ${colors.split(' ')[0]}`}
                  onClick={() => onHeaderClick?.(layer)}
                  title={`Click to inspect ${layer.name} header`}
                >
                  <span className="text-xs font-mono font-bold -rotate-90 md:rotate-0">{layer.name.substring(0,3)}</span>
                </div>
              );
            })}
            
            {/* Payload */}
            <div className="flex items-center justify-center flex-grow px-4 bg-surfaceHover">
              <span className="font-mono text-sm text-textMuted truncate max-w-[150px]">
                {payloadData || "DATA"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
