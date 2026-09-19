import { EncapsulationVisualizer, ENCAPSULATION_MAX_STEPS } from './encapsulation';
import { DnsVisualizer, DNS_MAX_STEPS } from './dns';
import { TcpHandshakeVisualizer, TCP_HANDSHAKE_MAX_STEPS } from './tcp-handshake';
import { TcpCongestionControlVisualizer, TCP_CC_MAX_STEPS } from './tcp-congestion-control';
import { DijkstraVisualizer, DIJKSTRA_MAX_STEPS } from './dijkstra';
import { DistanceVectorVisualizer, DV_MAX_STEPS } from './distance-vector';
import { Ipv4AddressingVisualizer, IPV4_MAX_STEPS } from './ipv4-addressing';
import { NATVisualizer, NAT_MAX_STEPS } from './nat';
import type { ComponentType } from 'react';

export interface TopicDefinition {
  title: string;
  intro: string;
  theory: string;
  maxSteps: number;
  unitId: string;
  Visualizer: ComponentType<{ currentStep: number }>;
}

export const topicRegistry: Record<string, TopicDefinition> = {
  'encapsulation': {
    title: 'Protocol Layering & Encapsulation',
    intro: 'This visualization demonstrates the life of an HTTP GET request traveling from a Client to a Server through an intermediate Router, highlighting how each layer adds and removes headers.',
    theory: `
### Key Concepts

- **Encapsulation**: At the sender, each layer takes the data from the layer above and adds its own header to create a new protocol data unit (PDU).
- **Decapsulation**: At the receiver, each layer strips its own header and passes the remaining payload up to the next layer.
- **Router Processing**: Routers operate up to the Network Layer (Layer 3). They decapsulate the frame up to the IP packet, decrement the TTL, recalculate the IP checksum, and then encapsulate the IP packet into a *brand new* Link Layer frame for the next hop.
- **End-to-End vs Point-to-Point**: Transport (TCP) and Application (HTTP) headers remain completely untouched from end to end. The Link (Ethernet) header is strictly point-to-point and changes at every hop.
    `,
    maxSteps: ENCAPSULATION_MAX_STEPS,
    unitId: 'unit-1',
    Visualizer: EncapsulationVisualizer
  },
  'dns-resolution': {
    title: 'DNS Resolution',
    intro: 'This visualization demonstrates the life of a DNS query traveling from a Client to a Local Resolver, and iteratively through the DNS hierarchy.',
    theory: `
### Key Concepts

- **Recursive Query**: The Client asks the Local Resolver to find the IP address for \`www.example.com\`. The Client does no further work and waits for the final answer.
- **Iterative Queries**: The Local Resolver contacts the Root, TLD, and Authoritative servers one by one. If a server doesn't know the answer, it returns a referral (a pointer to the next server to ask).
- **Hierarchy**: The Root server points to the TLD server (\`.com\`). The TLD server points to the Authoritative server (\`example.com\`). The Authoritative server returns the final IP address.
    `,
    maxSteps: DNS_MAX_STEPS,
    unitId: 'unit-1',
    Visualizer: DnsVisualizer
  },
  'tcp-handshake': {
    title: 'TCP Connection Management',
    intro: 'This visualization demonstrates the TCP 3-Way Handshake, Data Transfer, and 4-Way Teardown sequence. It establishes the exact TCP session used in the Protocol Encapsulation topic.',
    theory: `
### Key Concepts

- **3-Way Handshake**: TCP establishes a connection using SYN (synchronize) and ACK (acknowledge) flags. Both sides propose a randomized Initial Sequence Number (ISN).
- **Phantom Bytes**: Even when a segment has no payload (like a bare SYN or FIN), the flag itself consumes exactly one sequence number. This ensures the flags can be reliably acknowledged.
- **Acknowledgments**: An ACK number always means "the very next byte of data I expect to receive from you."
- **4-Way Teardown**: TCP connections are full-duplex. Closing them requires each side to independently send a FIN flag, which the other side must ACK.
    `,
    maxSteps: TCP_HANDSHAKE_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: TcpHandshakeVisualizer
  },
  'congestion-control': {
    title: 'TCP Congestion Control',
    intro: 'This visualization demonstrates TCP Congestion Control mechanisms over multiple Round Trip Times (RTTs).',
    theory: `
### Key Concepts

- **Slow Start**: When starting or recovering from a severe timeout loss, the sender exponentially grows its congestion window (cwnd), doubling it every RTT.
- **Congestion Avoidance**: When cwnd reaches the Slow Start Threshold (ssthresh), the sender shifts to a linear, additive increase phase (1 MSS per RTT).
- **Timeout Loss (Severe)**: When an ACK is severely delayed, cwnd resets to 1, ssthresh halves, and the phase forcibly returns to Slow Start.
- **Triple Duplicate ACK (Mild)**: When a packet is lost but subsequent packets arrive, duplicate ACKs trigger Fast Retransmit. cwnd and ssthresh both drop to half, and the phase remains in Congestion Avoidance.
    `,
    maxSteps: TCP_CC_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: TcpCongestionControlVisualizer
  },
  'dijkstra': {
    title: 'Dijkstra Routing',
    intro: "This visualization demonstrates Dijkstra's Link-State routing algorithm, computing the shortest path from a source node to all other nodes in a network.",
    theory: `
### Key Concepts

- **Link-State Routing**: Each node possesses the entire network topology and edge weights, allowing it to compute the shortest path locally.
- **Tentative Distances**: The algorithm continuously relaxes edges. A node's first reached distance is tentative and can be improved if a shorter overall path is found.
- **Greedy Selection**: At each step, the unvisited node with the lowest tentative distance is selected and marked as visited. Its distance is now guaranteed optimal.
    `,
    maxSteps: DIJKSTRA_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: DijkstraVisualizer
  },
  'distance-vector': {
    title: 'Distance Vector Routing',
    intro: 'This visualization demonstrates Distance Vector routing (Bellman-Ford) and the Count-to-Infinity problem.',
    theory: `
### Key Concepts

- **Distance Vector**: Each node maintains a vector of distances to all known destinations and shares only this vector with its immediate neighbors.
- **Bellman-Ford Equation**: Nodes iteratively compute their shortest path using the formula: $D_x(y) = \\min_v \\{ c(x,v) + D_v(y) \\}$.
- **Count-to-Infinity**: Because nodes don't share the *path* (only the cost), they can unknowingly route through each other. If a link fails, nodes may bounce stale estimates back and forth, counting up to infinity.
    `,
    maxSteps: DV_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: DistanceVectorVisualizer
  },
  'ipv4-addressing': {
    title: 'IPv4 Addressing & Header',
    intro: 'This visualization demonstrates the full IPv4 Datagram format and the bitwise mathematics of CIDR subnetting.',
    theory: `
### Key Concepts

- **IPv4 Datagram Header**: The standard IPv4 header is exactly 20 bytes (160 bits). It contains critical fields for routing (Source/Dest IP), lifespan (TTL), payload demultiplexing (Protocol), and fragmentation control (Identification, Flags, Fragment Offset).
- **Fragmentation**: When a router encounters a packet larger than the outbound link's MTU, it splits the payload into fragments. All fragments share the same Identification number. The "More Fragments" flag and "Fragment Offset" field allow the destination host to reassemble the pieces.
- **CIDR Subnetting**: Subnetting is fundamentally a bitwise masking operation. The Network Address is calculated by performing a Bitwise AND between the IP Address and the Subnet Mask. The Broadcast Address is calculated by performing a Bitwise OR between the Network Address and the inverted Subnet Mask.
    `,
    maxSteps: IPV4_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: Ipv4AddressingVisualizer
  },
  'nat': {
    title: 'Network Address Translation (NAT)',
    intro: 'This visualization demonstrates how a NAT Gateway allows private LANs to traverse the global internet by rewriting IP addresses and ports.',
    theory: `
### Key Concepts

- **Private vs Public IPs**: RFC 1918 defines address blocks (like \`192.168.x.x\`) that are completely unroutable on the public internet. NAT acts as a proxy, substituting its own public IP for outgoing traffic.
- **Translation Table**: The gateway tracks outbound connections, assigning an ephemeral public port to map back to the private client. It rewrites Source IP/Port for outbound packets and Destination IP/Port for inbound packets.
- **Incidental Firewall**: Because NAT fundamentally requires an outbound mapping to exist before it knows where to route inbound packets, unsolicited external traffic targeting the gateway's public IP is dropped by default, acting as a stateful firewall.
    `,
    maxSteps: NAT_MAX_STEPS,
    unitId: 'unit-2',
    Visualizer: NATVisualizer
  }
};
