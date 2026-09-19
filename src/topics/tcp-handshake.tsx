import React, { useState } from 'react';
import { SequenceDiagram, type SequenceActor, type SequenceMessage } from '../components/viz/SequenceDiagram';
import { PacketInspector, type PacketField } from '../components/viz/PacketInspector';

// --- DATA DEFINITIONS FROM SPEC --- //

const ACTORS: SequenceActor[] = [
  { id: 'client', name: 'Client', type: 'host (192.168.1.100)' },
  { id: 'server', name: 'Server', type: 'host (10.0.0.100)' }
];

// Helper to construct fields
const createFields = (
  isClient: boolean, 
  seq: number, 
  ack: number | string, 
  flags: string, 
  payloadLen: number
): PacketField[] => {
  return [
    { id: 'src', name: 'Src Port', value: isClient ? 49152 : 80, widthBits: 16, description: 'Source Port' },
    { id: 'dst', name: 'Dst Port', value: isClient ? 80 : 49152, widthBits: 16, description: 'Destination Port' },
    { id: 'seq', name: 'Seq Num', value: seq, widthBits: 32, description: 'Sequence Number', isHighlight: true },
    { id: 'ack', name: 'Ack Num', value: ack, widthBits: 32, description: 'Acknowledgment Number', isHighlight: true },
    { id: 'flags', name: 'Flags', value: flags, widthBits: 16, description: 'TCP Flags (SYN, ACK, FIN, PSH)' },
    { id: 'window', name: 'Window', value: 65535, widthBits: 16, description: 'Receive Window Size' },
    { id: 'len', name: 'Payload Len', value: payloadLen, widthBits: 16, description: 'Payload Length (Bytes)' }
  ];
};

const MESSAGES: SequenceMessage<PacketField[]>[] = [
  {
    id: 'm1', from: 'client', to: 'server', label: 'SYN (Seq=999)', stepIndex: 0,
    data: createFields(true, 999, '— (unused, ACK flag not set)', 'SYN', 0)
  },
  {
    id: 'm2', from: 'server', to: 'client', label: 'SYN-ACK (Seq=1999, Ack=1000)', stepIndex: 1,
    badge: 'SYN consumes 1 sequence number (Ack = 999 + 1)',
    data: createFields(false, 1999, 1000, 'SYN, ACK', 0)
  },
  {
    id: 'm3', from: 'client', to: 'server', label: 'ACK (Seq=1000, Ack=2000)', stepIndex: 2,
    data: createFields(true, 1000, 2000, 'ACK', 0)
  },
  {
    id: 'm4', from: 'client', to: 'server', label: 'HTTP GET (33 bytes)', stepIndex: 3,
    data: createFields(true, 1000, 2000, 'PSH, ACK', 33)
  },
  {
    id: 'm5', from: 'server', to: 'client', label: 'ACK (Seq=2000, Ack=1033)', stepIndex: 4,
    data: createFields(false, 2000, 1033, 'ACK', 0)
  },
  {
    id: 'm6', from: 'client', to: 'server', label: 'FIN (Seq=1033, Ack=2000)', stepIndex: 5,
    data: createFields(true, 1033, 2000, 'FIN, ACK', 0)
  },
  {
    id: 'm7', from: 'server', to: 'client', label: 'ACK (Seq=2000, Ack=1034)', stepIndex: 6,
    badge: 'FIN consumes 1 sequence number (Ack = 1033 + 1)',
    data: createFields(false, 2000, 1034, 'ACK', 0)
  },
  {
    id: 'm8', from: 'server', to: 'client', label: 'FIN (Seq=2000, Ack=1034)', stepIndex: 7,
    data: createFields(false, 2000, 1034, 'FIN, ACK', 0)
  },
  {
    id: 'm9', from: 'client', to: 'server', label: 'ACK (Seq=1034, Ack=2001)', stepIndex: 8,
    badge: 'FIN consumes 1 sequence number (Ack = 2000 + 1)',
    data: createFields(true, 1034, 2001, 'ACK', 0)
  }
];

const STEP_DESCRIPTIONS = [
  "Client initiates connection with a SYN segment, proposing Initial Sequence Number (ISN) 999.",
  "Server receives SYN, allocates buffers, and responds with SYN-ACK. It ACKs 1000 (999 + 1) because SYN acts as 1 phantom byte. Server proposes its own ISN 1999.",
  "Client acknowledges the Server's SYN. Ack is 2000 (1999 + 1). The 3-way handshake is complete. Both sides are ESTABLISHED.",
  "Client sends 33 bytes of HTTP GET data starting at Sequence 1000.",
  "Server acknowledges receipt of 33 bytes. It expects the next byte to be 1033 (1000 + 33).",
  "Client has no more data and initiates a graceful close by sending a FIN flag.",
  "Server acknowledges the Client's FIN. A FIN flag consumes 1 sequence number, so the server ACKs 1034 (1033 + 1).",
  "Server finishes its own processing and initiates its half of the closure with a FIN.",
  "Client acknowledges the Server's FIN (Ack = 2000 + 1). The connection is completely closed."
];

export interface TcpHandshakeVisualizerProps {
  currentStep: number;
}

export const TCP_HANDSHAKE_MAX_STEPS = MESSAGES.length - 1;

export function TcpHandshakeVisualizer({ currentStep }: TcpHandshakeVisualizerProps) {
  const [inspectedMsgId, setInspectedMsgId] = useState<string | null>(null);

  React.useEffect(() => {
    const currentMsg = MESSAGES.find(m => m.stepIndex === currentStep);
    if (currentMsg) {
      setInspectedMsgId(currentMsg.id);
    }
  }, [currentStep]);

  const activeMessage = MESSAGES.find(m => m.id === inspectedMsgId);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-surfaceHover p-4 rounded text-center text-text border border-border">
        <strong className="text-accent font-mono mr-2">Step {currentStep + 1}/{MESSAGES.length}:</strong>
        {STEP_DESCRIPTIONS[currentStep]}
      </div>

      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="w-full flex flex-col justify-start max-w-[1400px] mx-auto">
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
            title={`TCP Segment: ${activeMessage.label}`}
            fields={activeMessage.data}
          />
        ) : (
          <div className="text-textMuted font-mono italic">No message selected.</div>
        )}
      </div>
    </div>
  );
}
