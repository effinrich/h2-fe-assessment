import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getCropFrameBounds } from "@h2-fe/camera"
import { UiProvider } from "@h2-fe/ui"

import PdfViewerRoute from "./pdf-viewer-route"

const viewer = vi.hoisted(() => ({
  marks: null as null | ((value: boolean) => void),
  extensions: undefined as readonly object[] | undefined,
  retainPageBounds: undefined as unknown
}))

vi.mock("@h2-fe/pdf-viewer", () => ({
  usePdfPages: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn<() => void>()
  }),
  isPdfPageShape: () => false,
  PdfViewerScreen: ({
    filename,
    onMarksChange,
    onOpenAnother,
    extensions,
    retainPageBounds
  }: {
    filename: string
    onMarksChange: (value: boolean) => void
    onOpenAnother: () => void
    extensions?: readonly object[]
    retainPageBounds?: unknown
  }) => {
    viewer.marks = onMarksChange
    viewer.extensions = extensions
    viewer.retainPageBounds = retainPageBounds
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
  viewer.extensions = undefined
  viewer.retainPageBounds = undefined
  vi.restoreAllMocks()
})

describe("PdfViewerRoute exit protection", () => {
  it("leaves directly without marks", () => {
    renderRoute()
    expect(screen.getByText("sample.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy()
  })

  it("warns on unload, lets the user cancel, then discards marks on confirmation", async () => {
    renderRoute()
    act(() => viewer.marks?.(true))
    const unload = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    expect(await screen.findByRole("dialog", { name: "Leave this document?" })).toBeTruthy()
    expect(screen.getByText("Your marks aren't saved and will be lost.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Keep working" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(screen.getByText("sample.pdf")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Open another document" }))
    await screen.findByRole("dialog", { name: "Leave this document?" })
    fireEvent.click(screen.getByRole("button", { name: "Discard marks" }))
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy()
    const afterExit = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(afterExit)
    expect(afterExit.defaultPrevented).toBe(false)
  })
})

describe("PdfViewerRoute canvas extensions", () => {
  it("passes the pin and camera extensions, stable across re-renders", () => {
    renderRoute()
    const first = viewer.extensions
    expect(first).toHaveLength(2)

    act(() => viewer.marks?.(true))

    expect(viewer.extensions).toBe(first)
  })

  it("keeps pages under crop frames on the canvas", () => {
    renderRoute()
    expect(viewer.retainPageBounds).toBe(getCropFrameBounds)
  })
})
