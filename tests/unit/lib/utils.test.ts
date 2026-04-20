import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('should merge clsx classes', () => {
    expect(cn('text-red', 'text-blue')).toBe('text-blue')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('should handle conditional false', () => {
    const isActive = false
    expect(cn('base', isActive && 'active')).toBe('base')
  })

  it('should merge tailwind classes with conflicts', () => {
    expect(cn('text-red text-lg', 'text-blue text-sm')).toBe('text-blue text-sm')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('should handle undefined and null', () => {
    expect(cn('text-red', undefined, null, 'text-blue')).toBe('text-blue')
  })

  it('should handle multiple conditionals', () => {
    const isEnabled = true
    const isHighlighted = false
    const isBold = true
    expect(cn('base', isEnabled && 'enabled', isHighlighted && 'highlighted', isBold && 'bold')).toBe('base enabled bold')
  })
})