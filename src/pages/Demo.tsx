import React, { useState } from 'react';
import { SequenceDiagram } from '../components/viz/SequenceDiagram';
import { AlgorithmSimulation } from '../components/viz/AlgorithmSimulation';
import { TopologyGraph } from '../components/viz/TopologyGraph';
import { SignalWaveform } from '../components/viz/SignalWaveform';
import { PacketInspector } from '../components/viz/PacketInspector';
import { ComparativeCard } from '../components/viz/ComparativeCard';
import { LayerStack } from '../components/viz/LayerStack';
import { LiveTable } from '../components/viz/LiveTable';

export function Demo() {
  const DemoSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-12 flex flex-col gap-4">
      <h2 className="text-2xl font-bold font-mono text-accent border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  );

  // 1. Sequence Diagram State
  const seqActors = [
    { id: 'c', name: 'Client', type: 'host' },
    { id: 's', name: 'Server', type: 'server' }
  ];
  const seqMessages = [
    { id: '1', from: 'c', to: 's', label: 'SYN', stepIndex: 0 },
    { id: '2', from: 's', to: 'c', label: 'SYN-ACK', stepIndex: 1 },
    { id: '3', from: 'c', to: 's', label: 'ACK', stepIndex: 2 }
  ];

  // 2. Algorithm Simulation State
  const [algoParams, setAlgoParams] = useState<Record<string, any>>({
    loss: false,
    speed: 5,
    algo: 'dijkstra'
  });
  const [algoLogs, setAlgoLogs] = useState<string[]>([]);

  // 3. Topology Graph State
  const topNodes = [
    { id: 'A', label: 'Router A', type: 'router', x: 100, y: 150, state: 'visited' as const },
    { id: 'B', label: 'Router B', type: 'router', x: 300, y: 100, state: 'active' as const },
    { id: 'C', label: 'Router C', type: 'router', x: 300, y: 250, state: 'frontier' as const },
    { id: 'D', label: 'Router D', type: 'router', x: 500, y: 150, state: 'default' as const }
  ];
  const topEdges = [
    { id: 'e1', source: 'A', target: 'B', weight: 5, highlightState: 'accent-path' as const },
    { id: 'e2', source: 'A', target: 'C', weight: 10, highlightState: 'alternate-path' as const },
    { id: 'e3', source: 'B', target: 'D', weight: 2 },
    { id: 'e4', source: 'C', target: 'D', weight: 1 }
  ];
  const topPackets = [
    { id: 'p1', source: 'A', target: 'B', progress: 0.5, label: 'DATA' }
  ];

  // 5. Packet Inspector State
  const packetFields = [
    { id: 'f1', name: 'Source Port', value: 49152, widthBits: 16, description: 'Source Port' },
    { id: 'f2', name: 'Dest Port', value: 80, widthBits: 16, description: 'Destination Port', isHighlight: true },
    { id: 'f3', name: 'Seq Number', value: 0, widthBits: 32, description: 'Sequence Number' },
    { id: 'f4', name: 'Ack Number', value: 0, widthBits: 32, description: 'Acknowledgment Number' },
  ];

  // 8. Live Table State
  const tableCols = [
    { key: 'dest', header: 'Destination' },
    { key: 'nextHop', header: 'Next Hop' },
    { key: 'cost', header: 'Cost' }
  ];
  
  const initialTableData = [
    { id: 'r1', cells: { dest: '192.168.1.0/24', nextHop: 'Direct', cost: 0 } },
    { id: 'r2', cells: { dest: '10.0.0.0/8', nextHop: '192.168.1.1', cost: 5 } },
  ];
  
  const [tableData, setTableData] = useState(initialTableData);
  const [tableStates, setTableStates] = useState<Record<string, 'added'|'updated'|'removed'|'none'>>({});

  const doTableStep1 = () => {
    // Add a new row
    setTableData(prev => [
      ...prev,
      { id: 'r3', cells: { dest: '0.0.0.0/0', nextHop: '192.168.1.254', cost: 10 } }
    ]);
    setTableStates({ 'r3': 'added' });
  };

  const doTableStep2 = () => {
    // Update a different existing row (r2)
    setTableData(prev => prev.map(row => 
      row.id === 'r2' ? { ...row, cells: { ...row.cells, cost: 7 } } : row
    ));
    setTableStates({ 'r2': 'updated' });
  };

  const doTableStep3 = () => {
    // Remove the first row (r1) - simulated by marking it as removed visually
    setTableStates({ 'r1': 'removed' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold font-mono text-accent mb-8 text-center">Visualization Primitives Demo</h1>
      
      <DemoSection title="1. SequenceDiagram">
        <SequenceDiagram actors={seqActors} messages={seqMessages} currentStep={1} />
      </DemoSection>

      <DemoSection title="2. AlgorithmSimulation">
        <AlgorithmSimulation
          currentState={{ phase: 'Running', count: algoParams.speed }}
          parameters={[
            { type: 'toggle', id: 'loss', label: 'Simulate Packet Loss' },
            { type: 'range', id: 'speed', label: 'Simulation Speed', min: 1, max: 10, step: 1 },
            { type: 'select', id: 'algo', label: 'Routing Algorithm', options: [
              { label: 'Dijkstra', value: 'dijkstra' },
              { label: 'Bellman-Ford', value: 'bellman-ford' }
            ]}
          ]}
          parameterValues={algoParams}
          onParameterChange={(id, value) => {
            const logMsg = `Parameter changed: ${id} = ${value}`;
            console.log(logMsg);
            setAlgoLogs(prev => [...prev, logMsg]);
            setAlgoParams(prev => ({ ...prev, [id]: value }));
          }}
          renderFunction={() => (
            <div className="flex flex-col items-center p-8 bg-surfaceHover rounded border border-border">
              <span className="text-xl font-mono text-accent">State Renderer</span>
              <span className="text-textMuted mt-2">Loss Enabled: {algoParams.loss ? 'YES' : 'NO'}</span>
              <span className="text-textMuted">Speed: {algoParams.speed}</span>
              <span className="text-textMuted">Algorithm: {algoParams.algo}</span>
            </div>
          )}
        />
        <div className="mt-4 p-4 bg-black border border-border rounded">
          <h4 className="font-mono text-accent text-sm mb-2">Console Logs:</h4>
          <pre id="console-logs" className="text-xs font-mono text-textMuted">
            {algoLogs.join('\n')}
          </pre>
        </div>
      </DemoSection>

      <DemoSection title="3. TopologyGraph">
        <TopologyGraph nodes={topNodes} edges={topEdges} packets={topPackets} width={800} height={400} />
      </DemoSection>

      <DemoSection title="4. SignalWaveform">
        <SignalWaveform dataBits="10110010" encoding="NRZ" amplitude={30} frequency={1} noiseLevel={15} />
      </DemoSection>

      <DemoSection title="5. PacketInspector">
        <div className="flex justify-center">
          <PacketInspector title="TCP Header (Partial)" fields={packetFields} />
        </div>
      </DemoSection>

      <DemoSection title="6. ComparativeCard">
        <ComparativeCard 
          titleA="TCP" 
          titleB="UDP" 
          rows={[
            { feature: 'Connection', valueA: 'Connection-oriented', valueB: 'Connectionless' },
            { feature: 'Reliability', valueA: 'Reliable delivery', valueB: 'Best-effort' }
          ]} 
        />
      </DemoSection>

      <DemoSection title="7. LayerStack">
        <LayerStack 
          layers={[
            { id: 'application', name: 'Application' },
            { id: 'transport', name: 'Transport' },
            { id: 'network', name: 'Network' },
            { id: 'link', name: 'Link' },
            { id: 'physical', name: 'Physical' }
          ]}
          payloadData="HTTP GET /index.html"
          phase="router-partial"
          activeLayerId="network"
          currentStep={0}
        />
      </DemoSection>

      <DemoSection title="8. LiveTable Test">
        <div className="flex gap-4 mb-4">
          <button id="btn-step1" onClick={doTableStep1} className="px-4 py-2 bg-surfaceHover border border-border rounded text-text font-mono text-sm hover:bg-accent/20 hover:border-accent">Step 1: Add Row</button>
          <button id="btn-step2" onClick={doTableStep2} className="px-4 py-2 bg-surfaceHover border border-border rounded text-text font-mono text-sm hover:bg-accent/20 hover:border-accent">Step 2: Update r2</button>
          <button id="btn-step3" onClick={doTableStep3} className="px-4 py-2 bg-surfaceHover border border-border rounded text-text font-mono text-sm hover:bg-accent/20 hover:border-accent">Step 3: Remove r1</button>
        </div>
        <LiveTable title="Routing Table (R1)" columns={tableCols} data={tableData} rowStates={tableStates} />
      </DemoSection>

    </div>
  );
}
