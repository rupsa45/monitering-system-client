import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should have proper test environment', () => {
    expect(window).toBeDefined()
    expect(document).toBeDefined()
    expect(navigator).toBeDefined()
  })

  it('should have mocked APIs', () => {
    expect(window.matchMedia).toBeDefined()
    expect(global.ResizeObserver).toBeDefined()
    expect(global.IntersectionObserver).toBeDefined()
    expect(navigator.clipboard).toBeDefined()
    expect(URL.createObjectURL).toBeDefined()
  })
})





