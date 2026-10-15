import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Navigation } from './Navigation'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const navigationMocks = vi.hoisted(() => ({
  usePathname: vi.fn(() => '/map'),
}))

vi.mock('next/navigation', () => ({
  usePathname: navigationMocks.usePathname,
}))

vi.mock('../lib/flags', () => ({
  isFeatureEnabled: (flag: string) => {
    return flag === 'map' || flag === 'rig' || flag === 'market'
  },
}))

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

describe('STYLE S3: Bottom Navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    navigationMocks.usePathname.mockReturnValue('/map')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders container with 64px height, panel surface, and top border line', () => {
    render(<Navigation />)
    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass(
      'h-[calc(var(--nav-height)_+_max(env(safe-area-inset-bottom),0.5rem))]',
      'min-h-[var(--nav-height)]',
      'border-t',
      'border-line',
      'bg-panel'
    )
  })

  it('renders all five navigation items: Map, Rig, Market, Comms, Duel', () => {
    render(<Navigation />)
    expect(screen.getByTestId('nav-item-map')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-rig')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-market')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-comms')).toBeInTheDocument()
    expect(screen.getByTestId('nav-item-duel')).toBeInTheDocument()
  })

  it('routes enabled tabs to their pages and keeps flagged tabs gated', () => {
    render(<Navigation />)

    for (const [name, href] of [
      ['map', '/map'],
      ['rig', '/rig'],
      ['market', '/market'],
    ]) {
      const item = screen.getByTestId(`nav-item-${name}`)
      expect(item.tagName.toLowerCase()).toBe('a')
      expect(item).toHaveAttribute('href', href)
    }

    expect(screen.getByTestId('nav-item-comms').tagName.toLowerCase()).toBe('button')
    expect(screen.getByTestId('nav-item-duel').tagName.toLowerCase()).toBe('button')
  })

  it('keeps the map tab active while navigating through a terminal route', () => {
    navigationMocks.usePathname.mockReturnValue('/terminal/node-slums-01/success')
    render(<Navigation />)

    expect(screen.getByTestId('nav-item-map')).toHaveAttribute('aria-current', 'page')
  })

  it('highlights the active item with accent fill, white text, and aria-current="page"', () => {
    render(<Navigation />)
    const activeItem = screen.getByTestId('nav-item-map')
    expect(activeItem).toHaveAttribute('aria-current', 'page')
    expect(activeItem).toHaveClass('rounded-[8px]')
    expect(activeItem).toHaveStyle({
      backgroundColor: 'var(--accent)',
      color: 'var(--on-accent)',
    })

    const inactiveItem = screen.getByTestId('nav-item-rig')
    expect(inactiveItem).not.toHaveAttribute('aria-current')
    expect(inactiveItem).toHaveStyle({
      color: 'var(--ink-muted)',
    })
  })

  it('renders 22px SVG icons with stroke-width 1.8 and round joins', () => {
    render(<Navigation />)
    const activeItem = screen.getByTestId('nav-item-map')
    const svg = activeItem.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '22')
    expect(svg).toHaveAttribute('height', '22')
    expect(svg).toHaveAttribute('stroke-width', '1.8')
    expect(svg).toHaveAttribute('stroke-linecap', 'round')
    expect(svg).toHaveAttribute('stroke-linejoin', 'round')
  })

  it('displays a "Coming soon" toast when a disabled stub item is pressed', () => {
    render(<Navigation />)
    const commsButton = screen.getByTestId('nav-item-comms')
    expect(commsButton.tagName.toLowerCase()).toBe('button')
    expect(screen.queryByTestId('nav-toast')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(commsButton)
    })

    const toast = screen.getByTestId('nav-toast')
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveTextContent('Coming soon')

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.queryByTestId('nav-toast')).not.toBeInTheDocument()
  })
})
