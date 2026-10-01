import { render, screen } from '@testing-library/react'
import App from './app'

// The canvas itself needs a real browser (canvas, ResizeObserver), so the app
// spec checks composition: the surface mounts and the empty state is offered.
// vi.mock is hoisted above the imports at runtime.
vi.mock('tldraw', () => ({
  Tldraw: () => <div data-testid="tldraw" />,
  AssetRecordType: { create: vi.fn() },
}))

describe('App', () => {
  it('mounts the document canvas', () => {
    render(<App />)
    expect(screen.getByTestId('tldraw')).toBeTruthy()
  })

  it('offers a way to get a document in before one is loaded', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /open pdf/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /use an example/i })).toBeTruthy()
  })
})
