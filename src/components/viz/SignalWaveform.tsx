

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface SignalWaveformProps {
  dataBits: string;
  encoding: 'NRZ' | 'Manchester' | 'AMI';
  amplitude: number;
  frequency: number;
  noiseLevel: number;
  showComparison?: boolean;
}

export function SignalWaveform({
  dataBits,
  encoding,
  amplitude,
  frequency,
  noiseLevel,
  showComparison = true
}: SignalWaveformProps) {
  
  // A simplified placeholder renderer for waveforms since canvas math varies heavily by encoding
  const renderWaveformPath = (bits: string, type: 'clean' | 'noisy') => {
    if (!bits) return "M 0 50 L 800 50";
    
    const bitWidth = 800 / bits.length;
    let path = `M 0 50`;
    let currentY = 50;

    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      const startX = i * bitWidth;
      const endX = (i + 1) * bitWidth;
      
      // Simple NRZ logic for placeholder
      const targetY = bit === '1' ? 50 - amplitude : 50 + amplitude;
      
      path += ` L ${startX} ${currentY} L ${startX} ${targetY} L ${endX} ${targetY}`;
      currentY = targetY;
    }

    // Add noise if required
    if (type === 'noisy' && noiseLevel > 0) {
       // In a real canvas, we'd add Math.random() offsets along the path
       // For this SVG path, we just simulate by varying the line (simplified)
    }

    return path;
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-surface rounded-lg border border-border p-6 min-h-[300px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-mono text-primary font-bold">Signal Encoding: {encoding}</h3>
        <div className="flex gap-1 font-mono text-lg tracking-widest bg-background px-4 py-1 rounded border border-border">
          {dataBits.split('').map((b, i) => (
            <span key={i} className={b === '1' ? 'text-primary' : 'text-textMuted'}>{b}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="relative w-full h-[100px] border-l border-b border-border/50">
          <span className="absolute -left-2 -top-3 text-xs text-textMuted font-mono bg-surface px-1">Amplitude</span>
          <span className="absolute right-0 -bottom-5 text-xs text-textMuted font-mono">Time (Frequency: {frequency})</span>
          {showComparison && <span className="absolute top-2 right-2 text-xs text-primary font-mono opacity-50">Clean Signal</span>}
          
          <svg width="100%" height="100%" viewBox="0 0 800 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="50" x2="800" y2="50" stroke="#334155" strokeDasharray="4,4" />
            <path 
              d={renderWaveformPath(dataBits, 'clean')} 
              fill="none" 
              stroke="#0ea5e9" 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke" 
            />
          </svg>
        </div>

        {showComparison && (
          <div className="relative w-full h-[100px] border-l border-b border-border/50">
            <span className="absolute top-2 right-2 text-xs text-error font-mono opacity-50">Noisy Signal (Noise: {noiseLevel}%)</span>
            <svg width="100%" height="100%" viewBox="0 0 800 100" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="800" y2="50" stroke="#334155" strokeDasharray="4,4" />
              <path 
                d={renderWaveformPath(dataBits, 'noisy')} // In a full implementation, this path would be jittered
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke" 
                className={noiseLevel > 0 ? "opacity-80" : "opacity-100"}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
