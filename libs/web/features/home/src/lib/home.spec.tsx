import { fireEvent, render, screen } from '@testing-library/react'
import { UiProvider } from '@h2-fe/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HomeScreen } from './home'
import type { HomeScreenProps } from './types'

// Spec: docs/specs/task-2-pdf.md criterion 1 —
// "Given no document, the canvas offers 'Open PDF' and 'Use an example'."
// The actions are callbacks the route wrapper provides; the file input is
// screen-internal, so its own click and change events settle the flow.

function renderScreen(props: HomeScreenProps) {
  return render(
    <UiProvider>
      <HomeScreen {...props} />
    </UiProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HomeScreen', () => {
  it('offers Open PDF and Use an example when there is no document', () => {
    renderScreen({ onFileChosen: vi.fn<() => void>(), onUseExample: vi.fn<() => void>() })
    // getByRole throws when absent, so these are real assertions.
    expect(screen.getByRole('button', { name: /open pdf/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /use an example/i })).toBeTruthy()
  })

  it('opens the file input when the Open PDF action is chosen', () => {
    renderScreen({ onFileChosen: vi.fn<() => void>(), onUseExample: vi.fn<() => void>() })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeTruthy()
    const clicks = vi.fn<(event: Event) => void>()
    input.addEventListener('click', clicks)
    fireEvent.click(screen.getByRole('button', { name: /open pdf/i }))
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  it('hands a picked file to the route', () => {
    const onFileChosen = vi.fn<(file: File) => void>()
    renderScreen({ onFileChosen, onUseExample: vi.fn<() => void>() })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['%PDF-1.4'], 'pick.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFileChosen).toHaveBeenCalledWith(file)
  })

  it('calls onUseExample when the example action is chosen', async () => {
    const onUseExample = vi.fn<() => void>()
    renderScreen({ onFileChosen: vi.fn<() => void>(), onUseExample })
    fireEvent.click(screen.getByRole('button', { name: /use an example/i }))
    expect(onUseExample).toHaveBeenCalledTimes(1)
  })

  it('disables both actions while busy', () => {
    renderScreen({
      onFileChosen: vi.fn<() => void>(),
      onUseExample: vi.fn<() => void>(),
      isBusy: true
    })
    expect(screen.getByRole('button', { name: /opening/i })).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: /use an example/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })
})
