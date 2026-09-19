
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { Slider } from './Slider'

interface StepControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onStepForward: () => void
  onStepBack: () => void
  onReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  disableStepBack?: boolean
  disableStepForward?: boolean
}

export function StepControls({
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  speed,
  onSpeedChange,
  disableStepBack = false,
  disableStepForward = false,
}: StepControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded bg-surface">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onReset} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onStepBack}
            disabled={disableStepBack || isPlaying}
            title="Step Back"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="icon" onClick={onPlayPause} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onStepForward}
            disabled={disableStepForward || isPlaying}
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 w-48">
          <span className="text-xs text-textMuted font-mono">Slow</span>
          <Slider
            min={1}
            max={5}
            step={1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span className="text-xs text-textMuted font-mono">Fast</span>
        </div>
      </div>
    </div>
  )
}
