import { EncapsulationVisualizer, ENCAPSULATION_MAX_STEPS } from './encapsulation';
import { DnsVisualizer, DNS_MAX_STEPS } from './dns';
import { TcpHandshakeVisualizer, TCP_HANDSHAKE_MAX_STEPS } from './tcp-handshake';
import { TcpCongestionControlVisualizer, TCP_CC_MAX_STEPS } from './tcp-congestion-control';
import { ComponentType } from 'react';

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
  }
};
