import { useState, useMemo } from 'react';
import { PacketInspector, type PacketField } from '../components/viz/PacketInspector';

export const IPV4_MAX_STEPS = 1; // Unused since we don't use AlgorithmSimulation

type FragState = 'unfragmented' | 'frag1' | 'frag2';

export function generatePacketFields(fragState: FragState): PacketField[] {
  let length = 1500;
  let flags = '000';
  let offset = 0;
  let isHighlight = false;

  if (fragState === 'unfragmented') {
    length = 1500;
    flags = 'MF=0';
    offset = 0;
    isHighlight = false;
  } else if (fragState === 'frag1') {
    length = 996; // 976 payload + 20 header
    flags = 'MF=1';
    offset = 0;
    isHighlight = true;
  } else if (fragState === 'frag2') {
    length = 524; // 504 payload + 20 header
    flags = 'MF=0';
    offset = 122; // 976 / 8 = 122
    isHighlight = true;
  }

  return [
    { id: 'version', name: 'Version', value: 4, widthBits: 4, description: 'IPv4 (0100)' },
    { id: 'ihl', name: 'IHL', value: 5, widthBits: 4, description: 'Header length: 5 (5 x 32-bit words = 20 bytes)' },
    { id: 'dscp', name: 'DSCP', value: 0, widthBits: 6, description: 'Standard best effort delivery' },
    { id: 'ecn', name: 'ECN', value: 0, widthBits: 2, description: 'Not ECN capable' },
    { id: 'length', name: 'Total Length', value: length, widthBits: 16, description: 'Total length of header + payload in bytes' },
    { id: 'id', name: 'Identification', value: '0x4D2A', widthBits: 16, isHighlight, description: 'Unique ID shared by all fragments to allow reassembly' },
    { id: 'flags', name: 'Flags', value: flags, widthBits: 3, isHighlight, description: '[Reserved, Do Not Fragment, More Fragments]' },
    { id: 'offset', name: 'Frag Offset', value: offset, widthBits: 13, isHighlight, description: 'Offset of this fragment in 8-byte blocks' },
    { id: 'ttl', name: 'TTL', value: 64, widthBits: 8, description: 'Time To Live (decrements every hop)' },
    { id: 'protocol', name: 'Protocol', value: 6, widthBits: 8, description: 'TCP payload (Protocol 6)' },
    { id: 'checksum', name: 'Checksum', value: '0xA1B2', widthBits: 16, description: 'Header checksum for corruption detection' },
    { id: 'src', name: 'Source IP', value: '192.168.1.100', widthBits: 32, description: 'Sender IP Address' },
    { id: 'dst', name: 'Dest IP', value: '10.0.0.100', widthBits: 32, description: 'Destination IP Address' }
  ];
}

interface SubnetResult {
  ip: string;
  mask: string;
  network: string;
  broadcast: string;
  numHosts: number;
  firstHost: string | null;
  lastHost: string | null;
  ipBin: string;
  maskBin: string;
  networkBin: string;
  broadcastBin: string;
  invMaskBin: string;
}

export function parseCidr(cidr: string): SubnetResult | null {
  const parts = cidr.split('/');
  if (parts.length !== 2) return null;
  
  const ipStr = parts[0];
  const maskStr = parts[1];
  
  const ipParts = ipStr.split('.').map(s => parseInt(s, 10));
  const maskBits = parseInt(maskStr, 10);
  
  if (ipParts.length !== 4 || ipParts.some(isNaN) || ipParts.some(p => p < 0 || p > 255)) return null;
  if (isNaN(maskBits) || maskBits < 0 || maskBits > 32) return null;

  let maskInt = 0;
  for (let i = 0; i < 32; i++) {
    if (i < maskBits) {
      maskInt |= (1 << (31 - i));
    }
  }

  const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
  
  const networkInt = ipInt & maskInt;
  const broadcastInt = networkInt | (~maskInt);
  
  const uIpInt = ipInt >>> 0;
  const uMaskInt = maskInt >>> 0;
  const uNetworkInt = networkInt >>> 0;
  const uBroadcastInt = broadcastInt >>> 0;
  const uInvMaskInt = (~maskInt) >>> 0;

  const toIp = (num: number) => [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');

  const toBin = (num: number) => {
    return [
      ((num >>> 24) & 255).toString(2).padStart(8, '0'),
      ((num >>> 16) & 255).toString(2).padStart(8, '0'),
      ((num >>> 8) & 255).toString(2).padStart(8, '0'),
      (num & 255).toString(2).padStart(8, '0')
    ].join('.');
  };
  
  return {
     ip: toIp(uIpInt),
     mask: toIp(uMaskInt),
     network: toIp(uNetworkInt),
     broadcast: toIp(uBroadcastInt),
     numHosts: maskBits >= 31 ? 0 : Math.pow(2, 32 - maskBits) - 2,
     firstHost: maskBits >= 31 ? null : toIp((uNetworkInt + 1) >>> 0),
     lastHost: maskBits >= 31 ? null : toIp((uBroadcastInt - 1) >>> 0),
     ipBin: toBin(uIpInt),
     maskBin: toBin(uMaskInt),
     networkBin: toBin(uNetworkInt),
     broadcastBin: toBin(uBroadcastInt),
     invMaskBin: toBin(uInvMaskInt)
  };
}

export function Ipv4AddressingVisualizer() {
  const [fragState, setFragState] = useState<FragState>('unfragmented');
  const [cidr, setCidr] = useState('192.168.1.100/26');
  const [hoveredField, setHoveredField] = useState<PacketField | null>(null);

  const fields = useMemo(() => generatePacketFields(fragState), [fragState]);
  const subnet = useMemo(() => parseCidr(cidr), [cidr]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto py-4">
      {/* PART A: IPv4 Header */}
      <section className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="bg-surfaceHover px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono text-accent">Part A: IPv4 Header (160 bits / 20 Bytes)</h2>
          <p className="text-sm text-textMuted mt-1">
            The exact bit-level layout of a standard IPv4 datagram. Hover over fields for details.
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setFragState('unfragmented')}
              className={`px-4 py-2 rounded font-mono text-sm border ${fragState === 'unfragmented' ? 'bg-accent text-background border-accent' : 'bg-surface border-border hover:border-accent text-text'}`}
            >
              Unfragmented
            </button>
            <button 
              onClick={() => setFragState('frag1')}
              className={`px-4 py-2 rounded font-mono text-sm border ${fragState === 'frag1' ? 'bg-accent text-background border-accent' : 'bg-surface border-border hover:border-accent text-text'}`}
            >
              Fragment 1
            </button>
            <button 
              onClick={() => setFragState('frag2')}
              className={`px-4 py-2 rounded font-mono text-sm border ${fragState === 'frag2' ? 'bg-accent text-background border-accent' : 'bg-surface border-border hover:border-accent text-text'}`}
            >
              Fragment 2
            </button>
          </div>

          <PacketInspector fields={fields} onFieldHover={setHoveredField} />

          <div className="mt-6 min-h-[60px] p-4 bg-background rounded border border-border flex items-center">
            {hoveredField ? (
              <div className="font-mono text-sm text-text">
                <span className="font-bold text-accent mr-2">{hoveredField.name}:</span>
                {hoveredField.description}
              </div>
            ) : (
              <div className="text-textMuted italic text-sm">Hover over a header field to see its description.</div>
            )}
          </div>
        </div>
      </section>

      {/* PART B: Subnet Calculator */}
      <section className="bg-surface rounded-lg border border-border overflow-hidden">
        <div className="bg-surfaceHover px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold font-mono text-accent">Part B: Bitwise Subnet Calculator</h2>
          <p className="text-sm text-textMuted mt-1">
            Subnetting is fundamentally a bitwise AND/OR operation. Enter a CIDR to compute its bounds.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-8 max-w-md">
            <label className="block text-sm font-bold text-text mb-2 font-mono">CIDR Address</label>
            <input 
              type="text" 
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              className="w-full bg-background border border-border text-lg rounded px-4 py-2 text-text focus:outline-none focus:border-accent font-mono"
              placeholder="192.168.1.100/26"
            />
            {!subnet && <div className="text-error text-sm mt-2">Invalid CIDR format (e.g., 192.168.1.100/26)</div>}
          </div>

          {subnet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                <div className="bg-background p-4 rounded border border-border">
                  <h3 className="font-bold text-textMuted mb-2 text-xs uppercase tracking-wider">Network Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm font-mono">
                    <span className="text-textMuted">IP Address:</span><span className="text-text">{subnet.ip}</span>
                    <span className="text-textMuted">Subnet Mask:</span><span className="text-text">{subnet.mask}</span>
                    <span className="text-textMuted mt-2 pt-2 border-t border-border/50">Network Address:</span><span className="text-accent mt-2 pt-2 border-t border-border/50">{subnet.network}</span>
                    <span className="text-textMuted">Broadcast Address:</span><span className="text-textMuted">{subnet.broadcast}</span>
                    <span className="text-textMuted mt-2 pt-2 border-t border-border/50">Usable Host Range:</span>
                    <span className="text-text mt-2 pt-2 border-t border-border/50">{subnet.firstHost ? `${subnet.firstHost} - ${subnet.lastHost}` : 'N/A'}</span>
                    <span className="text-textMuted">Total Usable Hosts:</span><span className="text-text">{subnet.numHosts}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-black/5 p-4 rounded border border-border overflow-x-auto">
                  <h3 className="font-bold text-textMuted mb-4 text-xs uppercase tracking-wider">Bitwise Computation</h3>
                  
                  <div className="flex flex-col gap-1 font-mono text-xs whitespace-pre">
                    <div className="text-textMuted mb-1">Network (IP AND Mask):</div>
                    <div className="text-text">  {subnet.ipBin.replace(/\./g, ' ')}  (IP)</div>
                    <div className="text-text">&amp; {subnet.maskBin.replace(/\./g, ' ')}  (Mask)</div>
                    <div className="text-border">---------------------------------------</div>
                    <div className="text-accent">  {subnet.networkBin.replace(/\./g, ' ')}  (Network)</div>
                    <div className="text-textMuted mb-6">  {subnet.maskBin.replace(/\./g, ' ')}  (Mask)</div>
                    <div className="text-textMuted">  {subnet.broadcastBin.replace(/\./g, ' ')}  (Broadcast)</div>
                    <div className="text-text">| {subnet.invMaskBin.replace(/\./g, ' ')}  (Inv. Mask)</div>
                    <div className="text-border">---------------------------------------</div>
                    <div className="text-textMuted">  {subnet.broadcastBin.replace(/\./g, ' ')}  (Broadcast)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
