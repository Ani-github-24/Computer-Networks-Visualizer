import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { StepControls } from '../components/ui/StepControls'
import { Button } from '../components/ui/Button'

export function Topic() {
  const { slug } = useParams<{ slug: string }>()
  
  // Mock state for the visualization shell
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3)
  const [showTheory, setShowTheory] = useState(false)

  // This would typically be fetched based on the slug
  const topicData = {
    title: slug?.toUpperCase().replace('-', ' ') || 'Protocol Topic',
    intro: 'This is a brief introductory paragraph explaining the core concept of this protocol or algorithm. It provides the necessary context before diving into the visualization.'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-textMuted hover:text-text transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-mono text-primary mb-3">{topicData.title}</h1>
        <p className="text-textMuted text-lg max-w-3xl leading-relaxed">
          {topicData.intro}
        </p>
      </header>

      {/* Visualization Container */}
      <div className="mb-8">
        <div className="bg-surface border border-border rounded-lg aspect-video w-full flex items-center justify-center mb-4 relative overflow-hidden shadow-sm">
          {/* Placeholder for the actual canvas/svg visualization */}
          <div className="text-center">
            <div className="font-mono text-border text-6xl mb-4 opacity-50">&lt;/&gt;</div>
            <p className="text-textMuted font-medium">Visualization Canvas</p>
            <p className="text-xs text-textMuted/70 mt-2 font-mono">Ready for protocol simulation</p>
          </div>
        </div>

        {/* Reusable Controls */}
        <StepControls 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onStepForward={() => {}}
          onStepBack={() => {}}
          onReset={() => setIsPlaying(false)}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Collapsible Theory Section */}
      <section className="bg-surface rounded-lg border border-border overflow-hidden">
        <button 
          onClick={() => setShowTheory(!showTheory)}
          className="w-full px-6 py-4 flex items-center justify-between bg-surfaceHover/50 hover:bg-surfaceHover transition-colors focus:outline-none"
        >
          <h2 className="text-xl font-semibold font-mono">How this works</h2>
          {showTheory ? <ChevronUp className="w-5 h-5 text-textMuted" /> : <ChevronDown className="w-5 h-5 text-textMuted" />}
        </button>
        
        {showTheory && (
          <div className="p-6 border-t border-border prose prose-invert max-w-none text-textMuted">
            <p>
              This section contains the detailed theoretical explanation of the protocol.
              It uses standard markdown-style typography to explain the steps occurring in the visualization above.
            </p>
            <h3 className="text-text font-medium mt-6 mb-3 text-lg">Key Concepts</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Concept point 1 explaining the mechanism</li>
              <li>Concept point 2 detailing the specific rules</li>
              <li>Concept point 3 covering edge cases</li>
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
