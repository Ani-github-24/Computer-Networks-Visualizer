import { useMemo } from 'react';
import { AlgorithmSimulation } from '../components/viz/AlgorithmSimulation';
import { TopologyGraph, type TopologyNode, type TopologyEdge } from '../components/viz/TopologyGraph';
import { LiveTable, type TableColumn, type LiveTableRow } from '../components/viz/LiveTable';

export const DIJKSTRA_MAX_STEPS = 5;

interface NodeState {
  id: string;
  dist: number;
  prev: string | null;
  status: 'unvisited' | 'frontier' | 'visited';
}

interface DijkstraState {
  step: number;
  description: string;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  tableData: LiveTableRow[];
  rowStates: Record<string, 'added' | 'updated' | 'removed' | 'none'>;
}

export interface DijkstraVisualizerProps {
  currentStep: number;
}

const BASE_NODES: TopologyNode[] = [
  { id: 'A', label: 'Router A', type: 'router', x: 100, y: 200 },
  { id: 'B', label: 'Router B', type: 'router', x: 300, y: 100 },
  { id: 'C', label: 'Router C', type: 'router', x: 300, y: 300 },
  { id: 'D', label: 'Router D', type: 'router', x: 500, y: 100 },
  { id: 'E', label: 'Router E', type: 'router', x: 500, y: 300 },
];

const BASE_EDGES: TopologyEdge[] = [
  { id: 'A-B', source: 'A', target: 'B', weight: 6, label: '6' },
  { id: 'A-C', source: 'A', target: 'C', weight: 2, label: '2' },
  { id: 'A-E', source: 'A', target: 'E', weight: 10, label: '10' },
  { id: 'B-C', source: 'B', target: 'C', weight: 1, label: '1' },
  { id: 'B-D', source: 'B', target: 'D', weight: 1, label: '1' },
  { id: 'C-D', source: 'C', target: 'D', weight: 5, label: '5' },
  { id: 'C-E', source: 'C', target: 'E', weight: 9, label: '9' },
  { id: 'D-E', source: 'D', target: 'E', weight: 1, label: '1' },
];

const TABLE_COLS: TableColumn[] = [
  { key: 'node', header: 'Node' },
  { key: 'dist', header: 'Distance' },
  { key: 'prev', header: 'Previous' }
];

function formatDist(d: number) {
  return d === Infinity ? '∞' : d.toString();
}

function buildTableData(nodes: Record<string, NodeState>): LiveTableRow[] {
  return ['A', 'B', 'C', 'D', 'E'].map(id => {
    const n = nodes[id];
    return {
      id,
      cells: {
        node: id,
        dist: formatDist(n.dist),
        prev: n.prev || '-'
      }
    };
  });
}

function getTopologyNodes(nodes: Record<string, NodeState>): TopologyNode[] {
  return BASE_NODES.map(bn => {
    const n = nodes[bn.id];
    let state: 'default' | 'active' | 'frontier' | 'visited' = 'default';
    if (n.status === 'visited') state = 'visited';
    else if (n.status === 'frontier') state = 'frontier';
    
    return { ...bn, state };
  });
}

function getTopologyEdges(treeEdges: string[]): TopologyEdge[] {
  return BASE_EDGES.map(be => ({
    ...be,
    highlightState: treeEdges.includes(be.id) ? 'primary-path' : 'none'
  }));
}

export function generateStates(): DijkstraState[] {
  const states: DijkstraState[] = [];
  
  // STEP 0: Init
  const s0Nodes: Record<string, NodeState> = {
    'A': { id: 'A', dist: 0, prev: null, status: 'unvisited' },
    'B': { id: 'B', dist: Infinity, prev: null, status: 'unvisited' },
    'C': { id: 'C', dist: Infinity, prev: null, status: 'unvisited' },
    'D': { id: 'D', dist: Infinity, prev: null, status: 'unvisited' },
    'E': { id: 'E', dist: Infinity, prev: null, status: 'unvisited' },
  };
  states.push({
    step: 0,
    description: "Initialization: Source A distance 0, others ∞.",
    nodes: getTopologyNodes(s0Nodes),
    edges: getTopologyEdges([]),
    tableData: buildTableData(s0Nodes),
    rowStates: {}
  });

  // STEP 1: Process A
  const s1Nodes: Record<string, NodeState> = {
    ...s0Nodes,
    'A': { ...s0Nodes['A'], status: 'visited' as const },
    'B': { ...s0Nodes['B'], dist: 6, prev: 'A', status: 'frontier' as const },
    'C': { ...s0Nodes['C'], dist: 2, prev: 'A', status: 'frontier' as const },
    'E': { ...s0Nodes['E'], dist: 10, prev: 'A', status: 'frontier' as const },
  };
  states.push({
    step: 1,
    description: "Process Node A (dist=0). Relax edges to B, C, E.",
    nodes: getTopologyNodes(s1Nodes),
    edges: getTopologyEdges([]),
    tableData: buildTableData(s1Nodes),
    rowStates: { 'B': 'updated', 'C': 'updated', 'E': 'updated' }
  });

  // STEP 2: Process C
  const s2Nodes: Record<string, NodeState> = {
    ...s1Nodes,
    'C': { ...s1Nodes['C'], status: 'visited' as const },
    'B': { ...s1Nodes['B'], dist: 3, prev: 'C' }, // 6 -> 3
    'D': { ...s1Nodes['D'], dist: 7, prev: 'C', status: 'frontier' as const },
  };
  states.push({
    step: 2,
    description: "Process Node C (dist=2). Relax edges to B, D, E. B distance drops to 3. E (dist=10) not improved by path via C (2+9=11).",
    nodes: getTopologyNodes(s2Nodes),
    edges: getTopologyEdges([]),
    tableData: buildTableData(s2Nodes),
    rowStates: { 'B': 'updated', 'D': 'updated' }
  });

  // STEP 3: Process B
  const s3Nodes: Record<string, NodeState> = {
    ...s2Nodes,
    'B': { ...s2Nodes['B'], status: 'visited' as const },
    'D': { ...s2Nodes['D'], dist: 4, prev: 'B' }, // 7 -> 4
  };
  states.push({
    step: 3,
    description: "Process Node B (dist=3). Relax edge to D. D distance drops from 7 to 4.",
    nodes: getTopologyNodes(s3Nodes),
    edges: getTopologyEdges([]),
    tableData: buildTableData(s3Nodes),
    rowStates: { 'D': 'updated' }
  });

  // STEP 4: Process D
  const s4Nodes: Record<string, NodeState> = {
    ...s3Nodes,
    'D': { ...s3Nodes['D'], status: 'visited' as const },
    'E': { ...s3Nodes['E'], dist: 5, prev: 'D' }, // 10 -> 5
  };
  states.push({
    step: 4,
    description: "Process Node D (dist=4). Relax edge to E. E distance drops from 10 to 5.",
    nodes: getTopologyNodes(s4Nodes),
    edges: getTopologyEdges([]),
    tableData: buildTableData(s4Nodes),
    rowStates: { 'E': 'updated' }
  });

  // STEP 5: Process E / Final
  const s5Nodes: Record<string, NodeState> = {
    ...s4Nodes,
    'E': { ...s4Nodes['E'], status: 'visited' as const },
  };
  states.push({
    step: 5,
    description: "Process Node E (dist=5). No unvisited neighbors. Shortest Path Tree complete.",
    nodes: getTopologyNodes(s5Nodes),
    edges: getTopologyEdges(['A-C', 'B-C', 'B-D', 'D-E']),
    tableData: buildTableData(s5Nodes),
    rowStates: {}
  });

  return states;
}

export function DijkstraVisualizer({ currentStep }: DijkstraVisualizerProps) {
  const allStates = useMemo(() => generateStates(), []);
  const currentState = allStates[currentStep] || allStates[0];

  const renderContent = (state: DijkstraState) => {
    return (
      <div className="w-full flex flex-col xl:flex-row gap-6 p-4">
        {/* Graph on the left/top */}
        <div className="flex-grow min-h-[400px]">
          <TopologyGraph 
            nodes={state.nodes} 
            edges={state.edges} 
            width={650} 
            height={450} 
          />
        </div>
        
        {/* Table on the right/bottom */}
        <div className="w-full xl:w-96 flex-shrink-0">
          <LiveTable
            title="Tentative Distance Table"
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
      <div className="bg-surfaceHover p-4 rounded text-center text-text border border-border">
        <strong className="text-primary font-mono mr-2">Step {currentStep}/{DIJKSTRA_MAX_STEPS}:</strong>
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
