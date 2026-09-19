import React from 'react'
import { cn } from '../../lib/utils'

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string
}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={cn(
        "w-full h-2 bg-surfaceHover rounded-lg appearance-none cursor-pointer accent-accent",
        className
      )}
      {...props}
    />
  )
}
