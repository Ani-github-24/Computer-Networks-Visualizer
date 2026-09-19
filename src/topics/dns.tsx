import React, { useState } from 'react';
import { SequenceDiagram, type SequenceActor, type SequenceMessage } from '../components/viz/SequenceDiagram';
import { TopologyGraph, type TopologyNode, type TopologyEdge } from '../components/viz/TopologyGraph';
import { PacketInspector, type PacketField } from '../components/viz/PacketInspector';

// --- DATA DEFINITIONS FROM SPEC --- //

const ACTORS: SequenceActor[] = [
  { id: 'client', name: 'Client', type: 'host' },
  { id: 'resolver', name: 'Local Resolver', type: 'server' },
  { id: 'root', name: 'Root Server', type: 'server' },
  { id: 'tld', name: 'TLD (.com)', type: 'server' },
  { id: 'auth', name: 'Auth (example)', type: 'server' }
];

const NODES: TopologyNode[] = [
  { id: 'client', label: 'Client (192.168.1.100)', x: 100, y: 200, state: 'default' },
  { id: 'resolver', label: 'Local Resolver (10.0.0.53)', x: 225, y: 200, state: 'default' },
  { id: 'root', label: 'Root (198.51.100.1)', x: 325, y: 50, state: 'default' },
  { id: 'tld', label: 'TLD (192.0.2.1)', x: 400, y: 200, state: 'default' },
  { id: 'auth', label: 'Auth (203.0.113.99)', x: 325, y: 350, state: 'default' }
];

const EDGES: TopologyEdge[] = [
  { id: 'e1', source: 'client', target: 'resolver' },
  { id: 'e2', source: 'resolver', target: 'root' },
  { id: 'e3', source: 'resolver', target: 'tld' },
  { id: 'e4', source: 'resolver', target: 'auth' }
];

// Helper to construct fields
const createFields = (qr: 'Query' | 'Response', rd: number, qname: string, qtype: string, ancount: number, nscount: number, answers?: PacketField[]): PacketField[] => {
  const fields: PacketField[] = [
    { id: 'id', name: 'ID', value: '0x1234', widthBits: 16, description: 'Transaction ID' },
    { id: 'flags', name: 'Flags', value: `${qr}, RD=${rd}`, widthBits: 16, description: 'Query/Response Flags', isHighlight: true },
    { id: 'qdcount', name: 'QDCOUNT', value: 1, widthBits: 16, description: 'Number of Questions' },
    { id: 'ancount', name: 'ANCOUNT', value: ancount, widthBits: 16, description: 'Number of Answers', isHighlight: qr === 'Response' },
    { id: 'nscount', name: 'NSCOUNT', value: nscount, widthBits: 16, description: 'Number of Authority Records', isHighlight: nscount > 0 },
    { id: 'arcount', name: 'ARCOUNT', value: nscount > 0 ? 1 : 0, widthBits: 16, description: 'Additional Records (Glue)' },
    { id: 'qname', name: 'QNAME', value: qname, widthBits: 64, description: 'Question Name' },
    { id: 'qtype', name: 'QTYPE', value: qtype, widthBits: 16, description: 'Question Type' }
  ];
  if (answers) {
    fields.push(...answers);
  }
  return fields;
};

const MESSAGES: SequenceMessage<PacketField[]>[] = [
  {
    id: 'm1', from: 'client', to: 'resolver', label: 'Query: www.example.com A', stepIndex: 0,
    data: createFields('Query', 1, 'www.example.com', 'A', 0, 0)
  },
  {
    id: 'm2', from: 'resolver', to: 'root', label: 'Query: www.example.com A', stepIndex: 1,
    data: createFields('Query', 0, 'www.example.com', 'A', 0, 0)
  },
  {
    id: 'm3', from: 'root', to: 'resolver', label: 'Referral: .com NS', stepIndex: 2,
    data: createFields('Response', 0, 'www.example.com', 'A', 0, 1, [
      { id: 'ans1', name: 'NS Record', value: '.com -> a.gtld-servers.net', widthBits: 128, description: 'Authority Referral' }
    ])
  },
  {
    id: 'm4', from: 'resolver', to: 'tld', label: 'Query: www.example.com A', stepIndex: 3,
    data: createFields('Query', 0, 'www.example.com', 'A', 0, 0)
  },
  {
    id: 'm5', from: 'tld', to: 'resolver', label: 'Referral: example.com NS', stepIndex: 4,
    data: createFields('Response', 0, 'www.example.com', 'A', 0, 1, [
      { id: 'ans1', name: 'NS Record', value: 'example.com -> ns1.example.com', widthBits: 128, description: 'Authority Referral' }
    ])
  },
  {
    id: 'm6', from: 'resolver', to: 'auth', label: 'Query: www.example.com A', stepIndex: 5,
    data: createFields('Query', 0, 'www.example.com', 'A', 0, 0)
  },
  {
    id: 'm7', from: 'auth', to: 'resolver', label: 'Answer: 203.0.113.123', stepIndex: 6,
    data: createFields('Response', 0, 'www.example.com', 'A', 1, 0, [
      { id: 'ans1', name: 'A Record', value: '203.0.113.123', widthBits: 64, description: 'Final IP Address', isHighlight: true }
    ])
  },
  {
    id: 'm8', from: 'resolver', to: 'client', label: 'Answer: 203.0.113.123', stepIndex: 7,
    data: createFields('Response', 1, 'www.example.com', 'A', 1, 0, [
      { id: 'ans1', name: 'A Record', value: '203.0.113.123', widthBits: 64, description: 'Final IP Address', isHighlight: true }
    ])
  }
];

// Map stepIndex to Node states
const getNodeStates = (step: number): Record<string, 'default'|'active'|'visited'> => {
  const states: Record<string, 'default'|'active'|'visited'> = {
    client: 'default', resolver: 'default', root: 'default', tld: 'default', auth: 'default'
  };
  
  // Base logic based on the spec
  if (step === 0) {
    states.client = 'active'; states.resolver = 'active';
  } else if (step === 1 || step === 2) {
    states.resolver = 'active'; states.root = 'active';
  } else if (step === 3 || step === 4) {
    states.root = 'visited'; states.resolver = 'active'; states.tld = 'active';
  } else if (step === 5 || step === 6) {
    states.root = 'visited'; states.tld = 'visited'; states.resolver = 'active'; states.auth = 'active';
  } else if (step === 7) {
    states.root = 'visited'; states.tld = 'visited'; states.auth = 'visited'; states.resolver = 'active'; states.client = 'active';
  }
  
  return states;
};

const STEP_DESCRIPTIONS = [
  "Client sends a RECURSIVE query to the Local Resolver. (Client waits).",
  "Resolver cache is empty. It sends an ITERATIVE query to the Root Server.",
  "Root Server responds with a REFERRAL (ANCOUNT=0) to the .com TLD servers.",
  "Resolver follows referral, sending an ITERATIVE query to the .com TLD Server.",
  "TLD Server responds with a REFERRAL (ANCOUNT=0) to the example.com Authoritative servers.",
  "Resolver follows referral, sending an ITERATIVE query to the Authoritative Server.",
  "Authoritative Server returns the final ANSWER (ANCOUNT=1).",
  "Resolver returns the final ANSWER to the Client. The recursive request is fulfilled."
];

export interface DnsVisualizerProps {
  currentStep: number;
}

export const DNS_MAX_STEPS = MESSAGES.length - 1;

export function DnsVisualizer({ currentStep }: DnsVisualizerProps) {
  // Keep track of which message is being inspected
  const [inspectedMsgId, setInspectedMsgId] = useState<string | null>(null);

  // Auto-inspect the current message when step changes
  React.useEffect(() => {
    const currentMsg = MESSAGES.find(m => m.stepIndex === currentStep);
    if (currentMsg) {
      setInspectedMsgId(currentMsg.id);
    }
  }, [currentStep]);

  const activeMessage = MESSAGES.find(m => m.id === inspectedMsgId);
  
  // Apply dynamic states to nodes
  const nodeStates = getNodeStates(currentStep);
  const dynamicNodes = NODES.map(n => ({
    ...n,
    state: nodeStates[n.id]
  }));

  // Dynamic edges: highlight the edge connecting the currently active nodes
  const dynamicEdges = EDGES.map(e => {
    const isSourceActive = nodeStates[e.source] === 'active';
    const isTargetActive = nodeStates[e.target] === 'active';
    return {
      ...e,
      highlightState: (isSourceActive && isTargetActive) ? 'primary-path' as const : undefined
    };
  });

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-surfaceHover p-4 rounded text-center text-text border border-border">
        <strong className="text-accent font-mono mr-2">Step {currentStep + 1}/{MESSAGES.length}:</strong>
        {STEP_DESCRIPTIONS[currentStep]}
      </div>

      <div className="flex gap-4 min-h-[450px]">
        {/* Left Side: Topology */}
        <div className="w-1/3 flex flex-col justify-center rounded overflow-hidden">
          <TopologyGraph 
            nodes={dynamicNodes} 
            edges={dynamicEdges} 
            width={500} 
            height={400} 
          />
        </div>

        {/* Right Side: Sequence */}
        <div className="w-2/3 flex flex-col justify-start">
          <SequenceDiagram 
            actors={ACTORS} 
            messages={MESSAGES} 
            currentStep={currentStep} 
            onMessageClick={(msg) => setInspectedMsgId(msg.id)}
          />
        </div>
      </div>

      <div className="h-[200px] flex justify-center items-start">
        {activeMessage?.data ? (
          <PacketInspector
            title={`DNS Message: ${activeMessage.label}`}
            fields={activeMessage.data}
          />
        ) : (
          <div className="text-textMuted font-mono italic">No message selected.</div>
        )}
      </div>
    </div>
  );
}
