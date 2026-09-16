import React from 'react';
import { Slider } from '../ui/Slider';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export type SimParameterConfig = 
  | { type: 'range'; id: string; label: string; min: number; max: number; step: number }
  | { type: 'toggle'; id: string; label: string }
  | { type: 'select'; id: string; label: string; options: { label: string; value: string }[] };

export interface AlgorithmSimulationProps<TState> {
  currentState: TState;
  parameters: SimParameterConfig[];
  parameterValues: Record<string, number | boolean | string>;
  onParameterChange: (id: string, value: number | boolean | string) => void;
  renderFunction: (state: TState) => React.ReactNode;
}

export function AlgorithmSimulation<TState>({
  currentState,
  parameters,
  parameterValues,
  onParameterChange,
  renderFunction
}: AlgorithmSimulationProps<TState>) {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full h-full">
      {/* Visualization Area */}
      <div className="flex-grow flex items-center justify-center bg-background rounded-lg border border-border p-4 overflow-hidden min-h-[400px]">
        {renderFunction(currentState)}
      </div>

      {/* Parameter Controls Panel */}
      {parameters.length > 0 && (
        <div className="w-full md:w-64 flex-shrink-0 bg-surface rounded-lg border border-border p-4 flex flex-col gap-4">
          <h3 className="font-mono text-sm text-textMuted uppercase tracking-wider mb-2">Parameters</h3>
          
          {parameters.map((param) => (
            <div key={param.id} className="flex flex-col gap-2">
              <label htmlFor={param.id} className="text-sm font-medium text-text flex justify-between">
                <span>{param.label}</span>
                {param.type === 'range' && (
                  <span className="text-textMuted font-mono text-xs">{parameterValues[param.id]}</span>
                )}
              </label>

              {param.type === 'range' && (
                <Slider
                  id={param.id}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={parameterValues[param.id] as number}
                  onChange={(e) => onParameterChange(param.id, Number(e.target.value))}
                />
              )}

              {param.type === 'toggle' && (
                <button
                  id={param.id}
                  onClick={() => onParameterChange(param.id, !parameterValues[param.id])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                    parameterValues[param.id] ? 'bg-primary' : 'bg-surfaceHover'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      parameterValues[param.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}

              {param.type === 'select' && (
                <select
                  id={param.id}
                  value={parameterValues[param.id] as string}
                  onChange={(e) => onParameterChange(param.id, e.target.value)}
                  className="w-full bg-background border border-border text-sm rounded px-3 py-2 text-text focus:outline-none focus:border-primary"
                >
                  {param.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
