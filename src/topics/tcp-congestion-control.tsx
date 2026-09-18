import React, { useState, useEffect, useMemo } from 'react';
import { AlgorithmSimulation, type SimParameterConfig } from '../components/viz/AlgorithmSimulation';

// --- DATA DEFINITIONS FROM SPEC --- //

interface TCPState {
  rtt: number;
  cwnd: number;
  ssthresh: number;
  phase: 'Slow Start' | 'Congestion Avoidance';
  event: string;
}

const INITIAL_STATE: TCPState = {
  rtt: 0,
  cwnd: 1,
  ssthresh: 64,
  phase: 'Slow Start',
  event: 'Start'
};

const TCP_CC_MAX_STEPS = 20;

function computeStates(history: string[], maxStep: number): TCPState[] {
  const states = [INITIAL_STATE];
  for (let i = 0; i < maxStep; i++) {
    const prev = states[i];
    const outcome = history[i] || 'Success'; // default if not set yet
    
    let nextCwnd = prev.cwnd;
    let nextSsthresh = prev.ssthresh;
    let nextPhase = prev.phase;
    
    if (outcome === 'Success') {
      if (prev.phase === 'Slow Start') {
        nextCwnd = prev.cwnd * 2;
        if (nextCwnd >= nextSsthresh) {
          nextPhase = 'Congestion Avoidance';
        }
      } else {
        nextCwnd = prev.cwnd + 1;
      }
    } else if (outcome === 'Timeout') {
      nextSsthresh = Math.max(Math.floor(prev.cwnd / 2), 2);
      nextCwnd = 1;
      nextPhase = 'Slow Start';
    } else if (outcome === '3x Dup ACK') {
      nextSsthresh = Math.max(Math.floor(prev.cwnd / 2), 2);
      nextCwnd = nextSsthresh;
      nextPhase = 'Congestion Avoidance';
    }
    
    states.push({
      rtt: i + 1,
      cwnd: nextCwnd,
      ssthresh: nextSsthresh,
      phase: nextPhase,
      event: outcome
    });
  }
  return states;
}

export interface TcpCongestionControlVisualizerProps {
  currentStep: number;
}

export { TCP_CC_MAX_STEPS };

export function TcpCongestionControlVisualizer({ currentStep }: TcpCongestionControlVisualizerProps) {
  const [outcomeHistory, setOutcomeHistory] = useState<string[]>([]);
  const [prevStep, setPrevStep] = useState(0);
  const [outcomeParam, setOutcomeParam] = useState<string>('Success');

  useEffect(() => {
    if (currentStep > prevStep) {
      setOutcomeHistory(prev => {
        const newHistory = [...prev];
        // Fill any gaps just in case
        for (let i = prevStep; i < currentStep; i++) {
            newHistory[i] = i === prevStep ? outcomeParam : 'Success';
        }
        return newHistory;
      });
    }
    setPrevStep(currentStep);
  }, [currentStep, prevStep, outcomeParam]);

  const allStates = useMemo(() => computeStates(outcomeHistory, TCP_CC_MAX_STEPS), [outcomeHistory]);
  
  const currentState = allStates[currentStep] || allStates[0];

  const parameters: SimParameterConfig[] = [
    { 
      type: 'select', 
      id: 'next_outcome', 
      label: 'Next RTT Outcome', 
      options: [
        { label: 'Success (Advance RTT)', value: 'Success' },
        { label: 'Timeout (Severe Loss)', value: 'Timeout' },
        { label: '3x Dup ACK (Mild Loss)', value: '3x Dup ACK' }
      ] 
    }
  ];

  const parameterValues = {
    next_outcome: outcomeParam
  };

  const handleParameterChange = (id: string, value: string | number | boolean) => {
    if (id === 'next_outcome') {
      setOutcomeParam(value as string);
    }
  };

  const renderChart = (state: TCPState) => {
    const plottedStates = allStates.slice(0, currentStep + 1);
    const maxCwnd = Math.max(64, ...plottedStates.map(s => s.cwnd)) + 10;
    
    const width = 600;
    const height = 300;
    const paddingX = 40;
    const paddingY = 40;
    
    const getX = (rtt: number) => paddingX + (rtt / TCP_CC_MAX_STEPS) * (width - 2 * paddingX);
    const getY = (val: number) => height - paddingY - (val / maxCwnd) * (height - 2 * paddingY);

    const points = plottedStates.map(s => `${getX(s.rtt)},${getY(s.cwnd)}`).join(' ');
    const ssthreshPoints = plottedStates.map(s => `${getX(s.rtt)},${getY(s.ssthresh)}`).join(' ');

    return (
      <div className="w-full h-full flex flex-col items-center p-2">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="bg-surface rounded border border-border">
          {/* Axes */}
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-border" strokeWidth="2" />
          <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="currentColor" className="text-border" strokeWidth="2" />
          
          {/* ssthresh dashed line */}
          <polyline
            fill="none"
            stroke="currentColor"
            className="text-error opacity-50"
            strokeWidth="2"
            strokeDasharray="5,5"
            points={ssthreshPoints}
          />
          
          {/* cwnd line */}
          <polyline
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="3"
            points={points}
          />
          
          {/* Points and Event Labels */}
          {plottedStates.map((s, i) => (
            <g key={i}>
              <circle 
                cx={getX(s.rtt)} 
                cy={getY(s.cwnd)} 
                r={4} 
                fill="currentColor"
                className={s.phase === 'Slow Start' ? 'text-primary' : 'text-success'} 
              />
              {s.event !== 'Start' && s.event !== 'Success' && (
                <text x={getX(s.rtt)} y={getY(s.cwnd) - 10} fontSize="10" fill="currentColor" className="text-error font-mono text-anchor-middle" textAnchor="middle">
                  {s.event === 'Timeout' ? 'TO' : '3xDup'}
                </text>
              )}
            </g>
          ))}
          
          {/* Axes Labels */}
          <text x={width / 2} y={height - 10} fontSize="12" fill="currentColor" className="text-textMuted" textAnchor="middle">RTT</text>
          <text x={10} y={height / 2} fontSize="12" fill="currentColor" className="text-textMuted" textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`}>cwnd (MSS)</text>
        </svg>
        
        {/* Legend / Status */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-mono justify-center">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary inline-block"></span> Slow Start</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success inline-block"></span> Congestion Avoidance</div>
          <div className="flex items-center gap-2"><span className="w-4 h-1 border-b-2 border-dashed border-error inline-block"></span> ssthresh: {state.ssthresh}</div>
        </div>
        <div className="mt-2 text-sm font-mono text-text">
          Current cwnd: <span className="font-bold text-primary">{state.cwnd} MSS</span> | Phase: <span className="font-bold">{state.phase}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-surfaceHover p-4 rounded text-center text-text border border-border">
        <strong className="text-primary font-mono mr-2">RTT {currentStep}/{TCP_CC_MAX_STEPS}:</strong>
        {currentStep === 0 ? "Initial state. Select an outcome and step forward." : `Outcome: ${currentState.event}`}
      </div>

      <AlgorithmSimulation
        currentState={currentState}
        parameters={parameters}
        parameterValues={parameterValues}
        onParameterChange={handleParameterChange}
        renderFunction={renderChart}
      />
    </div>
  );
}
