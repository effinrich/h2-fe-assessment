import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import type { HomeScreenProps } from "./types"

import { HomeScreen } from "./home"

// Spec: docs/specs/task-2-pdf.md criterion 1 —
// "Given no document, the canvas offers 'Open PDF' and 'Use an example'."
// The actions are callbacks the route wrapper provides; the screen forwards
// the file input's change event without interpreting the chosen file.

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

describe("HomeScreen", () => {
  it("offers Open PDF and Use an example when there is no document", () => {
    renderScreen({ onFileChange: vi.fn<() => void>(), onUseExample: vi.fn<() => void>() })
    // getByRole throws when absent, so these are real assertions.
    expect(screen.getByRole("button", { name: /open pdf/i })).toBeTruthy()
    expect(screen.getByRole("button", { name: /use an example/i })).toBeTruthy()
  })

  it("wires Open PDF to a hidden PDF file input", () => {
    renderScreen({ onFileChange: vi.fn<() => void>(), onUseExample: vi.fn<() => void>() })
    expect(screen.getByRole("button", { name: /open pdf/i })).toBeTruthy()
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input?.getAttribute("accept")).toContain("application/pdf")
  })

  it("forwards file input changes to the route", () => {
    const onFileChange = vi.fn<React.ChangeEventHandler<HTMLInputElement>>()
    renderScreen({ onFileChange, onUseExample: vi.fn<() => void>() })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["%PDF-1.4"], "pick.pdf", { type: "application/pdf" })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFileChange).toHaveBeenCalledTimes(1)
    expect(onFileChange.mock.calls[0][0].target.files?.[0]).toBe(file)
  })

  it("calls onUseExample when the example action is chosen", async () => {
    const onUseExample = vi.fn<() => void>()
    renderScreen({ onFileChange: vi.fn<() => void>(), onUseExample })
    fireEvent.click(screen.getByRole("button", { name: /use an example/i }))
    expect(onUseExample).toHaveBeenCalledTimes(1)
  })

  it("disables both actions while busy", () => {
    renderScreen({
      onFileChange: vi.fn<() => void>(),
      onUseExample: vi.fn<() => void>(),
      isBusy: true
    })
    expect(screen.getByRole("button", { name: /opening/i })).toBeTruthy()
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: /use an example/i }).disabled
    ).toBe(true)
  })
})
