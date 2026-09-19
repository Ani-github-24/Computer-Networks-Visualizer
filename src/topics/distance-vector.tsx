import { useMemo } from 'react';
import { AlgorithmSimulation } from '../components/viz/AlgorithmSimulation';
import { TopologyGraph, type TopologyNode, type TopologyEdge } from '../components/viz/TopologyGraph';
import { LiveTable, type TableColumn, type LiveTableRow } from '../components/viz/LiveTable';

export const DV_MAX_STEPS = 11;

interface NodeState {
  id: string;
  dist: number;
  nextHop: string | null;
}

export interface DVState {
  step: number;
  description: string;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  tableData: LiveTableRow[];
  rowStates: Record<string, 'added' | 'updated' | 'removed' | 'none'>;
}

export interface DistanceVectorVisualizerProps {
  currentStep: number;
}

const BASE_NODES: TopologyNode[] = [
  { id: 'A', label: 'Router A (Dest)', type: 'router', x: 100, y: 200 },
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
  { key: 'dist', header: 'Dist to A' },
  { key: 'nextHop', header: 'Next Hop' }
];

function formatDist(d: number) {
  return d >= 16 ? '∞ (16)' : d.toString();
}

function buildTableData(nodes: Record<string, NodeState>): LiveTableRow[] {
  // Only rows for B, C, D, E (distance to A)
  return ['B', 'C', 'D', 'E'].map(id => {
    const n = nodes[id];
    return {
      id,
      cells: {
        node: id,
        dist: formatDist(n.dist),
        nextHop: n.nextHop || '-'
      }
    };
  });
}

function getTopologyNodes(): TopologyNode[] {
  return BASE_NODES.map(bn => {
    return { ...bn, state: bn.id === 'A' ? 'active' : 'default' };
  });
}

function getTopologyEdges(brokenEdges: string[], activePaths: Record<string, string>): TopologyEdge[] {
  const treeEdges = Object.values(activePaths);
  return BASE_EDGES.map(be => {
    if (brokenEdges.includes(be.id)) {
      return { ...be, label: '50', highlightState: 'alternate-path' as const };
    }
    return {
      ...be,
      highlightState: treeEdges.includes(be.id) ? 'primary-path' : 'none'
    };
  });
}

export function generateStates(): DVState[] {
  const states: DVState[] = [];
  
  // STEP 0: Init
  const s0Nodes: Record<string, NodeState> = {
    'B': { id: 'B', dist: 6, nextHop: 'A' },
    'C': { id: 'C', dist: 2, nextHop: 'A' },
    'D': { id: 'D', dist: 16, nextHop: null },
    'E': { id: 'E', dist: 10, nextHop: 'A' },
  };
  states.push({
    step: 0,
    description: "Round 0 (Init): Nodes only know direct costs to A. D is ∞ (16).",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges([], { 'B': 'A-B', 'C': 'A-C', 'E': 'A-E' }),
    tableData: buildTableData(s0Nodes),
    rowStates: {}
  });

  // STEP 1
  const s1Nodes: Record<string, NodeState> = {
    ...s0Nodes,
    'B': { ...s0Nodes['B'], dist: 3, nextHop: 'C' },
    'D': { ...s0Nodes['D'], dist: 7, nextHop: 'B' },
  };
  states.push({
    step: 1,
    description: "Round 1: Neighbors exchange vectors. B updates to 3 via C. D calculates: via B (1+6=7), or via C (5+2=7). D updates to 7 via B.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges([], { 'B': 'B-C', 'C': 'A-C', 'D': 'B-D', 'E': 'A-E' }),
    tableData: buildTableData(s1Nodes),
    rowStates: { 'B': 'updated', 'D': 'updated' }
  });

  // STEP 2
  const s2Nodes: Record<string, NodeState> = {
    ...s1Nodes,
    'D': { ...s1Nodes['D'], dist: 4, nextHop: 'B' },
    'E': { ...s1Nodes['E'], dist: 8, nextHop: 'D' },
  };
  states.push({
    step: 2,
    description: "Round 2: D sees B's new cost (3) and updates to 1+3=4 via B. E sees D's new cost (7) and updates to 1+7=8 via D.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges([], { 'B': 'B-C', 'C': 'A-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s2Nodes),
    rowStates: { 'D': 'updated', 'E': 'updated' }
  });

  // STEP 3
  const s3Nodes: Record<string, NodeState> = {
    ...s2Nodes,
    'E': { ...s2Nodes['E'], dist: 5, nextHop: 'D' },
  };
  states.push({
    step: 3,
    description: "Round 3: E sees D's new cost (4) and updates to 1+4=5 via D.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges([], { 'B': 'B-C', 'C': 'A-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s3Nodes),
    rowStates: { 'E': 'updated' }
  });

  // STEP 4
  const s4Nodes = { ...s3Nodes };
  states.push({
    step: 4,
    description: "Round 4: No further changes. Converged! Notice the final costs (B:3, C:2, D:4, E:5) exactly match Dijkstra's shortest path.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges([], { 'B': 'B-C', 'C': 'A-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s4Nodes),
    rowStates: {}
  });

  // STEP 5 (Failure)
  const s5Nodes: Record<string, NodeState> = {
    ...s4Nodes,
    'C': { ...s4Nodes['C'], dist: 4, nextHop: 'B' },
  };
  states.push({
    step: 5,
    description: "Round 5 (FAILURE): Link A-C jumps to cost 50! C checks neighbors (stale R4 values). C sees B claims cost 3, updates to 1+3=4 via B.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'B-C', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s5Nodes),
    rowStates: { 'C': 'updated' }
  });

  // STEP 6
  const s6Nodes: Record<string, NodeState> = {
    ...s5Nodes,
    'B': { ...s5Nodes['B'], dist: 5, nextHop: 'C' },
  };
  states.push({
    step: 6,
    description: "Round 6: B uses C's R5 value (4). B updates to 1+4=5 via C. B has no idea C's route actually relies on B! This is Count-to-Infinity.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'B-C', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s6Nodes),
    rowStates: { 'B': 'updated' }
  });

  // STEP 7
  const s7Nodes: Record<string, NodeState> = {
    ...s6Nodes,
    'C': { ...s6Nodes['C'], dist: 6, nextHop: 'B' },
    'D': { ...s6Nodes['D'], dist: 6, nextHop: 'B' },
  };
  states.push({
    step: 7,
    description: "Round 7: C uses B's R6 value (5). C updates to 1+5=6 via B. D also updates to 1+5=6 via B.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'B-C', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s7Nodes),
    rowStates: { 'C': 'updated', 'D': 'updated' }
  });

  // STEP 8
  const s8Nodes: Record<string, NodeState> = {
    ...s7Nodes,
    'B': { ...s7Nodes['B'], dist: 6, nextHop: 'A' },
    'E': { ...s7Nodes['E'], dist: 7, nextHop: 'D' },
  };
  states.push({
    step: 8,
    description: "Round 8: B checks C(6). Cost 1+6=7. BUT direct A-B is 6! B abandons C and anchors at 6 via A. Loop broken before infinity!",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'A-B', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s8Nodes),
    rowStates: { 'B': 'updated', 'E': 'updated' }
  });

  // STEP 9
  const s9Nodes: Record<string, NodeState> = {
    ...s8Nodes,
    'C': { ...s8Nodes['C'], dist: 7, nextHop: 'B' },
    'D': { ...s8Nodes['D'], dist: 7, nextHop: 'B' },
  };
  states.push({
    step: 9,
    description: "Round 9: C and D use B's R8 anchored value (6). Both update to 1+6=7 via B.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'A-B', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s9Nodes),
    rowStates: { 'C': 'updated', 'D': 'updated' }
  });

  // STEP 10
  const s10Nodes: Record<string, NodeState> = {
    ...s9Nodes,
    'E': { ...s9Nodes['E'], dist: 8, nextHop: 'D' },
  };
  states.push({
    step: 10,
    description: "Round 10: E uses D's R9 value (7). E updates to 1+7=8 via D.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'A-B', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s10Nodes),
    rowStates: { 'E': 'updated' }
  });

  // STEP 11
  const s11Nodes = { ...s10Nodes };
  states.push({
    step: 11,
    description: "Round 11: No further changes. Converged! Final distances: B=6, C=7, D=7, E=8.",
    nodes: getTopologyNodes(),
    edges: getTopologyEdges(['A-C'], { 'B': 'A-B', 'C': 'B-C', 'D': 'B-D', 'E': 'D-E' }),
    tableData: buildTableData(s11Nodes),
    rowStates: {}
  });

  return states;
}

export function DistanceVectorVisualizer({ currentStep }: DistanceVectorVisualizerProps) {
  const allStates = useMemo(() => generateStates(), []);
  const currentState = allStates[currentStep] || allStates[0];

  const renderContent = (state: DVState) => {
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
            title="Distance-to-A Table"
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
        <strong className="text-accent font-mono mr-2">Step {currentStep}/{DV_MAX_STEPS}:</strong>
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
