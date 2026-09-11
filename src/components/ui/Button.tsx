import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none",
        {
          'bg-primary text-text hover:bg-primaryHover': variant === 'primary',
          'bg-surfaceHover text-text hover:bg-border': variant === 'secondary',
          'border border-border bg-transparent hover:bg-surfaceHover text-text': variant === 'outline',
          'bg-transparent hover:bg-surfaceHover text-textMuted hover:text-text': variant === 'ghost',
          
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
          'h-10 w-10 p-2': size === 'icon',
        },
        className
      )}
      {...props}
    />
  )
}
