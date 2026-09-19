
import { Link } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { Card, CardHeader, CardTitle, CardDescription,  } from '../components/ui/Card'

const units = [
  {
    id: 'unit-1',
    title: 'Unit I',
    topics: [
      { id: 'encapsulation', title: 'Protocol Encapsulation', description: 'OSI and TCP/IP protocol layering, encapsulation and decapsulation', status: 'Available' },
      { id: 'dns-resolution', title: 'DNS Resolution', description: 'Recursive vs Iterative queries in the Domain Name System', status: 'Available' },
      { id: 'csma-cd', title: 'CSMA/CD', description: 'Carrier Sense Multiple Access with Collision Detection protocol', status: 'Coming soon' },
      { id: 'token-ring', title: 'Token Ring', description: 'Local area network protocol using a token-passing mechanism', status: 'Coming soon' },
    ]
  },
  {
    id: 'unit-2',
    title: 'Unit II',
    topics: [
      { id: 'tcp-handshake', title: 'TCP 3-Way Handshake', description: 'Connection establishment in Transmission Control Protocol', status: 'Available' },
      { id: 'congestion-control', title: 'TCP Congestion Control', description: 'Algorithms to avoid network congestion', status: 'Available' },
      { id: 'ipv4-addressing', title: 'IPv4 Addressing & Header', description: 'Datagram format, fragmentation, and CIDR subnetting', status: 'Available' },
      { id: 'nat', title: 'Network Address Translation (NAT)', description: 'Translation tables, port mapping, and incidental firewall behavior', status: 'Available' },
      { id: 'dijkstra', title: 'Dijkstra Routing', description: 'Shortest path first routing algorithm', status: 'Available' },
      { id: 'distance-vector', title: 'Distance Vector', description: 'Routing protocol using distance-vector algorithms', status: 'Available' },
    ]
  }

]

  export function Home() {
    return (
      <div className="container mx-auto px-4 py-8 max-w-[1400px]">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 font-mono tracking-tight text-accent">CN Visualizer</h1>
          <p className="text-lg text-textMuted max-w-2xl mx-auto">
            Interactive visualizations for Computer Networks protocols and algorithms.
          </p>
        </header>
  
        <Tabs defaultValue="unit-1" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {units.map((unit) => (
                <TabsTrigger key={unit.id} value={unit.id}>
                  {unit.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
  
          {units.map((unit) => (
            <TabsContent key={unit.id} value={unit.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unit.topics.map((topic) => (
                  <Link 
                    key={topic.id} 
                    to={topic.status === 'Available' ? `/topic/${topic.id}` : '#'}
                    className={topic.status === 'Available' ? 'block' : 'block cursor-not-allowed opacity-75'}
                    onClick={(e) => topic.status !== 'Available' && e.preventDefault()}
                  >
                    <Card className="h-full transition-all hover:border-accent hover:shadow-sm group">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="group-hover:text-accent transition-colors flex-1 min-w-0">
                            {topic.title}
                          </CardTitle>
                          <span className={`shrink-0 whitespace-nowrap text-xs px-2 py-1 rounded-full font-mono font-medium ${
                            topic.status === 'Available' 
                              ? 'bg-accent/10 text-accent border border-accent/20' 
                              : 'bg-surfaceHover text-textMuted border border-border'
                          }`}>
                            {topic.status}
                          </span>
                      </div>
                      <CardDescription className="pt-2">
                        {topic.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
