// src/components/ui/Input.tsx
'use client'

import React, { InputHTMLAttributes, forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholderClassName?: string
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ placeholderClassName, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={twMerge(
          'border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'placeholder-gray-400',
          placeholderClassName,
          className
        )}
      />
    )
  }
)

Input.displayName = 'Input'
export default Input