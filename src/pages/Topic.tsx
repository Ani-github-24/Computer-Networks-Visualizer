import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { StepControls } from '../components/ui/StepControls'
import { topicRegistry } from '../topics'
import ReactMarkdown from 'react-markdown'

export function Topic() {
  const { slug } = useParams<{ slug: string }>()
  const topicData = slug ? topicRegistry[slug] : null
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(3)
  const [currentStep, setCurrentStep] = useState(0)
  const [showTheory, setShowTheory] = useState(false)

  // Auto-play interval logic
  useEffect(() => {
    if (!isPlaying || !topicData) return;
    
    // Invert speed to ms: e.g. speed 1 = 2000ms, speed 10 = 200ms
    const intervalMs = 2000 - ((speed - 1) * 200); 
    
    const intervalId = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= topicData.maxSteps) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isPlaying, speed, topicData?.maxSteps]);

  const handleStepForward = useCallback(() => {
    if (topicData && currentStep < topicData.maxSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, topicData]);

  const handleStepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  if (!topicData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-mono text-error mb-4">Topic not found: {slug}</h2>
        <Link to="/" className="text-accent hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const Visualizer = topicData.Visualizer;

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-textMuted hover:text-text transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-mono text-accent mb-3">{topicData.title}</h1>
        <p className="text-textMuted text-lg max-w-3xl leading-relaxed">
          {topicData.intro}
        </p>
      </header>

      {/* Visualization Container */}
      <div className="mb-8">
        <div className="bg-surface border border-border rounded-lg w-full flex items-center justify-center mb-4 relative overflow-hidden shadow-sm p-4">
          <Visualizer currentStep={currentStep} />
        </div>

        {/* Reusable Controls */}
        <StepControls 
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onStepForward={handleStepForward}
          onStepBack={handleStepBack}
          onReset={handleReset}
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
          <div className="p-6 border-t border-border prose prose-invert max-w-none text-textMuted font-mono">
            <ReactMarkdown>{topicData.theory}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  )
}
