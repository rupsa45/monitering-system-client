import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
})

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:test'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
})

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: vi.fn(),
})

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})





