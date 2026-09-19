import { useMemo } from 'react';
import { AlgorithmSimulation } from '../components/viz/AlgorithmSimulation';
import { TopologyGraph, type TopologyNode, type TopologyEdge } from '../components/viz/TopologyGraph';
import { LiveTable, type TableColumn, type LiveTableRow } from '../components/viz/LiveTable';
import { PacketInspector, type PacketField } from '../components/viz/PacketInspector';

export const NAT_MAX_STEPS = 7;

export interface NATState {
  step: number;
  description: string;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  tableData: LiveTableRow[];
  rowStates: Record<string, 'added' | 'updated' | 'removed' | 'none'>;
  packet: PacketField[] | null;
}

export interface NATVisualizerProps {
  currentStep: number;
}

const BASE_NODES: TopologyNode[] = [
  { id: 'client', label: 'Client (192.168.1.100)', type: 'host', x: 100, y: 300 },
  { id: 'gateway', label: 'NAT Gateway', type: 'router', x: 400, y: 300 },
  { id: 'server', label: 'Web Server', type: 'host', x: 700, y: 200 },
  { id: 'hacker', label: 'Malicious Host', type: 'host', x: 700, y: 400 },
];

const BASE_EDGES: TopologyEdge[] = [
  { id: 'lan', source: 'client', target: 'gateway', label: 'LAN' },
  { id: 'wan-server', source: 'gateway', target: 'server', label: 'WAN' },
  { id: 'wan-hacker', source: 'gateway', target: 'hacker', label: 'WAN' },
];

const TABLE_COLS: TableColumn[] = [
  { key: 'wan', header: 'WAN Side (Public IP:Port)' },
  { key: 'lan', header: 'LAN Side (Private IP:Port)' },
  { key: 'dest', header: 'Destination (IP:Port)' },
  { key: 'status', header: 'Status' }
];

function makePacket(srcIp: string, srcPort: string, dstIp: string, dstPort: string): PacketField[] {
  return [
    { id: 'srcIp', name: 'Source IP', value: srcIp, widthBits: 32, description: 'Source IP Address' },
    { id: 'srcPort', name: 'Source Port', value: srcPort, widthBits: 16, description: 'Source Port' },
    { id: 'dstIp', name: 'Dest IP', value: dstIp, widthBits: 32, description: 'Destination IP Address' },
    { id: 'dstPort', name: 'Dest Port', value: dstPort, widthBits: 16, description: 'Destination Port' }
  ];
}

function getTopology(activeNodes: string[], activeEdges: string[]): { nodes: TopologyNode[], edges: TopologyEdge[] } {
  return {
    nodes: BASE_NODES.map(n => ({
      ...n,
      state: activeNodes.includes(n.id) ? 'active' : 'default'
    })),
    edges: BASE_EDGES.map(e => ({
      ...e,
      highlightState: activeEdges.includes(e.id) ? 'primary-path' : 'none'
    }))
  };
}

export function generateStates(): NATState[] {
  const states: NATState[] = [];

  // STEP 1: Client sends request
  states.push({
    step: 1,
    description: "Step 1: Client sends HTTP request. The source IP is RFC 1918 private, which cannot route on the global internet.",
    ...getTopology(['client'], ['lan']),
    packet: makePacket('192.168.1.100', '49152', '203.0.113.1', '80'),
    tableData: [],
    rowStates: {}
  });

  // STEP 2: Gateway creates mapping
  states.push({
    step: 2,
    description: "Step 2: Packet hits NAT Gateway. Recognizing the private source, the Gateway allocates WAN port 5000 and creates a mapping.",
    ...getTopology(['gateway'], []),
    packet: makePacket('192.168.1.100', '49152', '203.0.113.1', '80'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Created'
      }
    }],
    rowStates: { 'conn1': 'added' }
  });

  // STEP 3: Gateway forwards request (WAN)
  states.push({
    step: 3,
    description: "Step 3: Gateway rewrites the Source IP and Port, then forwards it to the WAN. The private IP is completely obscured from the internet.",
    ...getTopology(['gateway'], ['wan-server']),
    packet: makePacket('198.51.100.1', '5000', '203.0.113.1', '80'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Active'
      }
    }],
    rowStates: { 'conn1': 'updated' }
  });

  // STEP 4: Server replies (WAN)
  states.push({
    step: 4,
    description: "Step 4: The public server processes the request and replies back to the only IP it knows: the Gateway's public IP.",
    ...getTopology(['server'], ['wan-server']),
    packet: makePacket('203.0.113.1', '80', '198.51.100.1', '5000'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Active'
      }
    }],
    rowStates: {}
  });

  // STEP 5: Gateway translates reply
  states.push({
    step: 5,
    description: "Step 5: Gateway receives reply on WAN port 5000. It looks up the port in its Translation Table to find the mapped LAN client.",
    ...getTopology(['gateway'], []),
    packet: makePacket('203.0.113.1', '80', '198.51.100.1', '5000'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Matched'
      }
    }],
    rowStates: { 'conn1': 'updated' }
  });

  // STEP 6: Gateway forwards reply (LAN)
  states.push({
    step: 6,
    description: "Step 6: Gateway rewrites Destination IP and Port to the private address, forwarding it to the Client.",
    ...getTopology(['gateway'], ['lan']),
    packet: makePacket('203.0.113.1', '80', '192.168.1.100', '49152'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Active'
      }
    }],
    rowStates: { 'conn1': 'updated' }
  });

  // STEP 7: Unsolicited Inbound Traffic
  states.push({
    step: 7,
    description: "Step 7 (Failure): Malicious host attempts to scan Gateway on port 5001. Gateway finds NO matching translation entry and drops the packet. NAT incidentally acts as a stateful firewall.",
    ...getTopology(['hacker', 'gateway'], ['wan-hacker']),
    packet: makePacket('203.0.113.50', '23456', '198.51.100.1', '5001'),
    tableData: [{
      id: 'conn1',
      cells: {
        wan: '198.51.100.1:5000',
        lan: '192.168.1.100:49152',
        dest: '203.0.113.1:80',
        status: 'Active'
      }
    }],
    rowStates: {}
  });

  return states;
}

export function NATVisualizer({ currentStep }: NATVisualizerProps) {
  const allStates = useMemo(() => generateStates(), []);
  // Adjust for 0-indexed arrays while steps are 1-7
  const currentState = allStates[currentStep - 1] || allStates[0];

  const renderContent = (state: NATState) => {
    return (
      <div className="w-full flex flex-col xl:flex-row gap-6 p-4">
        <div className="flex-grow flex flex-col gap-6">
          {/* Top: Graph */}
          <div className="w-full bg-surface border border-border rounded p-4 h-[350px]">
             <TopologyGraph 
                nodes={state.nodes} 
                edges={state.edges} 
                width={800} 
                height={320} 
              />
          </div>

          {/* Bottom: Packet */}
          <div className="w-full">
            <h3 className="text-primary font-mono text-sm mb-2 uppercase tracking-wide">Current Packet Header (IP / Port)</h3>
            {state.packet ? (
              <PacketInspector fields={state.packet} title="Packet Trace" />
            ) : (
              <div className="p-4 border border-border border-dashed text-textMuted rounded">No active packet in transit.</div>
            )}
          </div>
        </div>
        
        {/* Right: Table */}
        <div className="w-full xl:w-[450px] flex-shrink-0">
          <LiveTable
            title="NAT Translation Table"
            columns={TABLE_COLS}
            data={state.tableData}
            rowStates={state.rowStates}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-surfaceHover p-4 rounded text-text border border-border">
        <strong className="text-primary font-mono mr-2">Step {currentState.step}/{NAT_MAX_STEPS}:</strong>
        {currentState.description}
      </div>

      <AlgorithmSimulation
        currentState={currentState}
        parameters={[]}
        parameterValues={{}}
        onParameterChange={() => {}}
        renderFunction={renderContent}
      />
    </div>
  );
}
