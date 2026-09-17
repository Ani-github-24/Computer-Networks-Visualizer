import React, { useState } from 'react';
import { LayerStack, type LayerData } from '../components/viz/LayerStack';
import { PacketInspector, type PacketField } from '../components/viz/PacketInspector';

// --- DATA DEFINITIONS FROM SPEC --- //

const appFields: PacketField[] = [
  { id: 'app1', name: 'Method', value: 'GET', widthBits: 24, description: 'HTTP Method' },
  { id: 'app2', name: 'URI', value: '/index.html', widthBits: 88, description: 'Request URI' },
  { id: 'app3', name: 'Version', value: 'HTTP/1.1', widthBits: 64, description: 'HTTP Version' },
  { id: 'app4', name: 'Host', value: 'example.com', widthBits: 88, description: 'Host Header' }
];

const transportFields: PacketField[] = [
  { id: 'tra1', name: 'Src Port', value: 49152, widthBits: 16, description: 'Client ephemeral port' },
  { id: 'tra2', name: 'Dst Port', value: 80, widthBits: 16, description: 'Web server port' },
  { id: 'tra3', name: 'Seq Num', value: 1000, widthBits: 32, description: 'Sequence Number' },
  { id: 'tra4', name: 'Ack Num', value: 2000, widthBits: 32, description: 'Acknowledging previous SYN-ACK' },
  { id: 'tra5', name: 'Hdr Len', value: 5, widthBits: 4, description: '5 32-bit words (20 bytes)' },
  { id: 'tra6', name: 'Rsvd', value: 0, widthBits: 6, description: 'Reserved' },
  { id: 'tra7', name: 'Flags', value: 'PSH,ACK', widthBits: 6, description: 'TCP Flags' },
  { id: 'tra8', name: 'Window', value: 65535, widthBits: 16, description: 'Window Size' },
  { id: 'tra9', name: 'Checksum', value: '0x1A2B', widthBits: 16, description: 'Header Checksum' },
  { id: 'tra10', name: 'Urg Ptr', value: 0, widthBits: 16, description: 'Urgent Pointer' }
];

const networkFieldsBase: PacketField[] = [
  { id: 'net1', name: 'Ver/IHL', value: '4/5', widthBits: 8, description: 'IPv4, 20 bytes' },
  { id: 'net2', name: 'Total Len', value: 73, widthBits: 16, description: '33b HTTP + 20b TCP + 20b IP' },
  { id: 'net3', name: 'TTL', value: 64, widthBits: 8, description: 'Time to Live (Original)' },
  { id: 'net4', name: 'Proto', value: 6, widthBits: 8, description: 'TCP' },
  { id: 'net5', name: 'Checksum', value: '0x9876', widthBits: 16, description: 'Header Checksum (Original)' },
  { id: 'net6', name: 'Src IP', value: '192.168.1.100', widthBits: 32, description: 'Client IP' },
  { id: 'net7', name: 'Dst IP', value: '10.0.0.100', widthBits: 32, description: 'Server IP' }
];

const networkFieldsRouter: PacketField[] = [
  ...networkFieldsBase.filter(f => f.name !== 'TTL' && f.name !== 'Checksum'),
  { id: 'net3', name: 'TTL', value: 63, widthBits: 8, description: 'Time to Live (Decremented by Router)', isHighlight: true },
  { id: 'net5', name: 'Checksum', value: '0x9877', widthBits: 16, description: 'Header Checksum (Recalculated)', isHighlight: true }
];
// reorder properly for visual consistency
networkFieldsRouter.splice(2, 0, networkFieldsRouter.pop()!); // TTL
networkFieldsRouter.splice(4, 0, networkFieldsRouter.pop()!); // Checksum

const linkFieldsSender: PacketField[] = [
  { id: 'lnk1', name: 'Dst MAC', value: '00:11:22:33:44:55', widthBits: 48, description: 'Router Inbound MAC' },
  { id: 'lnk2', name: 'Src MAC', value: '00:1A:2B:3C:4D:5E', widthBits: 48, description: 'Client MAC' },
  { id: 'lnk3', name: 'EtherType', value: '0x0800', widthBits: 16, description: 'IPv4' }
];

const linkFieldsRouter: PacketField[] = [
  { id: 'lnk1', name: 'Dst MAC', value: '11:22:33:44:55:66', widthBits: 48, description: 'Server MAC', isHighlight: true },
  { id: 'lnk2', name: 'Src MAC', value: 'AA:BB:CC:DD:EE:FF', widthBits: 48, description: 'Router Outbound MAC', isHighlight: true },
  { id: 'lnk3', name: 'EtherType', value: '0x0800', widthBits: 16, description: 'IPv4' }
];

const physicalFields: PacketField[] = [
  { id: 'phy1', name: 'Preamble', value: '101010...', widthBits: 56, description: 'Clock synchronization' },
  { id: 'phy2', name: 'SFD', value: '10101011', widthBits: 8, description: 'Start Frame Delimiter' }
];

const BASE_LAYERS: LayerData[] = [
  { id: 'application', name: 'Application', headerFields: appFields },
  { id: 'transport', name: 'Transport', headerFields: transportFields },
  { id: 'network', name: 'Network', headerFields: networkFieldsBase },
  { id: 'link', name: 'Link', headerFields: linkFieldsSender },
  { id: 'physical', name: 'Physical', headerFields: physicalFields }
];

// --- STEP SEQUENCE DEFINITION --- //

type StepConfig = {
  phase: 'sender' | 'router-partial' | 'receiver';
  activeLayer: 'application' | 'transport' | 'network' | 'link' | 'physical';
  layers: LayerData[];
  description: string;
};

const SEQUENCE: StepConfig[] = [
  // SENDER
  { phase: 'sender', activeLayer: 'application', layers: BASE_LAYERS, description: "Client Application creates the HTTP GET request." },
  { phase: 'sender', activeLayer: 'transport', layers: BASE_LAYERS, description: "Client Transport layer encapsulates HTTP data into a TCP segment." },
  { phase: 'sender', activeLayer: 'network', layers: BASE_LAYERS, description: "Client Network layer encapsulates TCP segment into an IPv4 datagram." },
  { phase: 'sender', activeLayer: 'link', layers: BASE_LAYERS, description: "Client Link layer creates an Ethernet frame addressed to the default gateway (Router's MAC)." },
  { phase: 'sender', activeLayer: 'physical', layers: BASE_LAYERS, description: "Client Physical layer converts frame to bits with Preamble/SFD and transmits." },
  
  // ROUTER
  { phase: 'router-partial', activeLayer: 'physical', layers: BASE_LAYERS, description: "Router Physical layer receives bits from wire." },
  { phase: 'router-partial', activeLayer: 'link', layers: BASE_LAYERS, description: "Router Link layer strips frame, verifies Dst MAC matches its own inbound interface." },
  { phase: 'router-partial', activeLayer: 'network', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter }, // Network changes!
      BASE_LAYERS[3], BASE_LAYERS[4]
    ], description: "Router Network layer reads Dst IP, decrements TTL, and recalculates Checksum. TCP and HTTP layers are completely untouched." },
  { phase: 'router-partial', activeLayer: 'link', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter }, // Link changes!
      BASE_LAYERS[4]
    ], description: "Router Link layer builds a BRAND NEW frame addressed to the Server's MAC, using its own outbound MAC as source." },
  { phase: 'router-partial', activeLayer: 'physical', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Router Physical layer transmits new frame onto the next link." },
    
  // RECEIVER
  { phase: 'receiver', activeLayer: 'physical', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Server Physical layer receives bits." },
  { phase: 'receiver', activeLayer: 'link', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Server Link layer verifies Dst MAC, strips Ethernet header." },
  { phase: 'receiver', activeLayer: 'network', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Server Network layer verifies Dst IP, strips IPv4 header." },
  { phase: 'receiver', activeLayer: 'transport', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Server Transport layer verifies Dst Port (80), strips TCP header." },
  { phase: 'receiver', activeLayer: 'application', layers: [
      BASE_LAYERS[0], BASE_LAYERS[1], 
      { id: 'network', name: 'Network', headerFields: networkFieldsRouter },
      { id: 'link', name: 'Link', headerFields: linkFieldsRouter },
      BASE_LAYERS[4]
    ], description: "Server Application receives the raw HTTP GET request payload." }
];

export interface EncapsulationVisualizerProps {
  currentStep: number;
}

export const ENCAPSULATION_MAX_STEPS = SEQUENCE.length - 1;

export function EncapsulationVisualizer({ currentStep }: EncapsulationVisualizerProps) {
  const stepConfig = SEQUENCE[currentStep];
  
  // Keep track of which header is currently being inspected in the PacketInspector
  const [inspectedLayerId, setInspectedLayerId] = useState<string | null>(stepConfig.activeLayer);

  // If the step changes, auto-inspect the new active layer
  React.useEffect(() => {
    setInspectedLayerId(stepConfig.activeLayer);
  }, [stepConfig.activeLayer]);

  const activeLayerData = stepConfig.layers.find(l => l.id === inspectedLayerId);

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="bg-surfaceHover p-4 rounded text-center text-text border border-border">
        <strong className="text-primary font-mono mr-2">Step {currentStep + 1}/{SEQUENCE.length}:</strong>
        {stepConfig.description}
      </div>

      <div className="flex-grow min-h-[400px]">
        <LayerStack
          layers={stepConfig.layers}
          payloadData="GET /index.html"
          phase={stepConfig.phase}
          activeLayerId={stepConfig.activeLayer}
          onHeaderClick={(layer) => setInspectedLayerId(layer.id)}
        />
      </div>

      <div className="h-[200px] flex justify-center items-start">
        {activeLayerData?.headerFields ? (
          <PacketInspector
            title={`${activeLayerData.name} Header`}
            fields={activeLayerData.headerFields}
          />
        ) : (
          <div className="text-textMuted font-mono italic">No header data available for {activeLayerData?.name}.</div>
        )}
      </div>
    </div>
  );
}
