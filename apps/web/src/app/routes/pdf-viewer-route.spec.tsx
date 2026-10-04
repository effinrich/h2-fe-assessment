import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { UiProvider } from "@h2-fe/ui"

import PdfViewerRoute from "./pdf-viewer-route"

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal")
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close")

const viewer = vi.hoisted(() => ({ marks: null as null | ((value: boolean) => void) }))

vi.mock("@h2-fe/pdf-viewer", () => ({
  usePdfPages: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn<() => void>()
  }),
  PdfViewerScreen: ({
    filename,
    onMarksChange,
    onOpenAnother
  }: {
    filename: string
    onMarksChange: (value: boolean) => void
    onOpenAnother: () => void
  }) => {
    viewer.marks = onMarksChange
    return (
      <>
        <span>{filename}</span>
        <button onClick={onOpenAnother}>Open another document</button>
      </>
    )
  }
}))

function renderRoute() {
  return render(
    <UiProvider>
      <MemoryRouter
        initialEntries={[{ pathname: "/viewer", state: { file: new File(["pdf"], "sample.pdf") } }]}
      >
        <Routes>
          <Route path="/viewer" element={<PdfViewerRoute />} />
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
      </MemoryRouter>
    </UiProvider>
  )
}

afterEach(() => {
  viewer.marks = null
  if (originalShowModal)
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal)
  else delete (HTMLDialogElement.prototype as { showModal?: () => void }).showModal
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose)
  else delete (HTMLDialogElement.prototype as { close?: () => void }).close
  vi.restoreAllMocks()
})

describe("PdfViewerRoute exit protection", () => {
  it("leaves directly without marks", () => {
    renderRoute()
    expect(screen.getByText("sample.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy()
  })

  it("warns on unload, lets the user cancel, then discards marks on confirmation", () => {
    const showModal = vi.fn<(this: HTMLDialogElement) => void>(function () {
      this.open = true
    })
    vi.stubGlobal("HTMLDialogElement", HTMLDialogElement)
    HTMLDialogElement.prototype.showModal = showModal
    HTMLDialogElement.prototype.close = vi.fn<(this: HTMLDialogElement) => void>(function () {
      this.open = false
    })
    renderRoute()
    act(() => viewer.marks?.(true))
    const unload = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    expect(showModal).toHaveBeenCalled()
    expect(screen.getByText("Your marks aren't saved and will be lost.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Keep working" }))
    expect(screen.getByText("sample.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    fireEvent.click(screen.getByRole("button", { name: "Discard marks" }))
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy()
    const afterExit = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(afterExit)
    expect(afterExit.defaultPrevented).toBe(false)
  })
})
