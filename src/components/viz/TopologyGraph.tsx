import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// ============================================================================
// STATE CONTROL PATTERN:
// Every primitive here is fully controlled. The parent Topic page owns all 
// simulation state (current step, history arrays, current data snapshots) and 
// passes it down as props. StepControls only communicate with the parent, 
// never with these individual viz primitives directly.
// ============================================================================

export interface TopologyNode {
  id: string;
  label: string;
  type?: string; 
  x?: number; 
  y?: number; 
  state?: 'default' | 'active' | 'frontier' | 'visited';
}

export interface TopologyEdge {
  id: string;
  source: string; 
  target: string; 
  weight?: string | number;
  label?: string;
  highlightState?: 'primary-path' | 'alternate-path' | 'none';
}

export interface TopologyPacket {
  id: string;
  source: string; 
  target: string; 
  progress: number; 
  label?: string;
}

export interface TopologyGraphProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  packets?: TopologyPacket[];
  width?: number;
  height?: number;
  onNodeClick?: (node: TopologyNode) => void;
}

export function TopologyGraph({
  nodes,
  edges,
  packets = [],
  width = 800,
  height = 500,
  onNodeClick
}: TopologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Determine if we need force layout
    const needsForce = nodes.some(n => n.x === undefined || n.y === undefined);
    
    let simulationNodes = nodes.map(d => ({ ...d }));
    let simulationEdges = edges.map(d => ({ ...d, source: d.source, target: d.target }));

    if (needsForce) {
      const simulation = d3.forceSimulation(simulationNodes as any)
        .force("link", d3.forceLink(simulationEdges).id((d: any) => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .stop();

      // Run simulation statically to avoid bouncy rendering
      for (let i = 0; i < 300; ++i) simulation.tick();
    } else {
      // Use provided coordinates (assuming they are absolute or percentage, we assume absolute here)
      // If needed, scaling can be applied here based on width/height
    }

    const nodeMap = new Map(simulationNodes.map(n => [n.id, n as any]));

    // Draw Links
    svg.append("g")
      .selectAll("line")
      .data(simulationEdges)
      .join("line")
      .attr("stroke", (d: any) => {
        if (d.highlightState === 'primary-path') return '#0ea5e9'; // primary
        if (d.highlightState === 'alternate-path') return '#f59e0b'; // warning
        return '#334155'; // border
      })
      .attr("stroke-width", (d: any) => d.highlightState && d.highlightState !== 'none' ? 4 : 2)
      .attr("stroke-dasharray", (d: any) => d.highlightState === 'alternate-path' ? "5,5" : "none")
      .attr("x1", (d: any) => typeof d.source === 'object' ? d.source.x : nodeMap.get(d.source).x)
      .attr("y1", (d: any) => typeof d.source === 'object' ? d.source.y : nodeMap.get(d.source).y)
      .attr("x2", (d: any) => typeof d.target === 'object' ? d.target.x : nodeMap.get(d.target).x)
      .attr("y2", (d: any) => typeof d.target === 'object' ? d.target.y : nodeMap.get(d.target).y);

    // Link Labels (Weights)
    svg.append("g")
      .selectAll("text")
      .data(simulationEdges.filter(d => d.weight !== undefined || d.label !== undefined))
      .join("text")
      .text((d: any) => d.label || d.weight)
      .attr("x", (d: any) => {
        const s = typeof d.source === 'object' ? d.source : nodeMap.get(d.source);
        const t = typeof d.target === 'object' ? d.target : nodeMap.get(d.target);
        return (s.x + t.x) / 2;
      })
      .attr("y", (d: any) => {
        const s = typeof d.source === 'object' ? d.source : nodeMap.get(d.source);
        const t = typeof d.target === 'object' ? d.target : nodeMap.get(d.target);
        return (s.y + t.y) / 2 - 5;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-family", "monospace")
      .attr("font-size", "12px")
      .attr("class", "select-none");

    // Draw Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(simulationNodes)
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .style("cursor", onNodeClick ? "pointer" : "default")
      .on("click", (_event, d) => onNodeClick?.(d as TopologyNode));

    node.append("circle")
      .attr("r", 20)
      .attr("fill", (d: any) => {
        if (d.state === 'active') return '#0ea5e9'; // primary
        if (d.state === 'frontier') return '#f59e0b'; // warning
        if (d.state === 'visited') return '#10b981'; // success
        return '#1e293b'; // surface
      })
      .attr("stroke", (d: any) => d.state === 'active' ? '#fff' : '#334155')
      .attr("stroke-width", 2);

    node.append("text")
      .text((d: any) => d.label)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#f8fafc")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("class", "select-none drop-shadow-md");

    // Node Type icon/text
    node.append("text")
      .text((d: any) => {
        if (d.type === 'router') return 'R';
        if (d.type === 'switch') return 'S';
        if (d.type === 'host') return 'H';
        return d.id.charAt(0).toUpperCase();
      })
      .attr("y", 5)
      .attr("text-anchor", "middle")
      .attr("fill", (d: any) => d.state === 'active' || d.state === 'visited' ? '#fff' : '#94a3b8')
      .attr("font-family", "monospace")
      .attr("font-weight", "bold");

    // Draw Packets
    if (packets.length > 0) {
      const packetGroup = svg.append("g");
      packets.forEach(p => {
        const sourceNode = nodeMap.get(p.source);
        const targetNode = nodeMap.get(p.target);
        
        if (sourceNode && targetNode) {
          const x = sourceNode.x + (targetNode.x - sourceNode.x) * p.progress;
          const y = sourceNode.y + (targetNode.y - sourceNode.y) * p.progress;
          
          const g = packetGroup.append("g")
            .attr("transform", `translate(${x},${y})`);
            
          g.append("rect")
            .attr("width", 16)
            .attr("height", 16)
            .attr("x", -8)
            .attr("y", -8)
            .attr("fill", "#0ea5e9") // primary
            .attr("rx", 3);
            
          if (p.label) {
            g.append("text")
              .text(p.label)
              .attr("y", -12)
              .attr("text-anchor", "middle")
              .attr("fill", "#0ea5e9")
              .attr("font-size", "10px")
              .attr("font-family", "monospace")
              .attr("font-weight", "bold");
          }
        }
      });
    }

  }, [nodes, edges, packets, width, height, onNodeClick]);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden flex justify-center items-center w-full">
      <svg ref={svgRef} width={width} height={height} className="max-w-full h-auto" />
    </div>
  );
}
