import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

import { UiProvider } from "@h2-fe/ui"

import App from "./app"

// Route-level behavior only: the table mounts home on '/', redirects '/viewer'
// with no handoff to home, and carries a handoff file through to the canvas
// surface. The handoff File object survives the navigation and even a refresh;
// jsdom cannot rasterise, so the exercised end is the honest error surface.
// Providers mirror main.tsx (Ui + Query clients) since the viewer route's
// raster actually runs here.
// The viewer route is a lazy chunk (tldraw + pdfjs); its cold load in jsdom
// outlasts waitFor's 1s default.
const LAZY_ROUTE_WAIT = { timeout: 10_000 }
const LAZY_ROUTE_TEST_TIMEOUT = 15_000

function renderAt(path: string, state?: unknown) {
  return render(
    <UiProvider>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[{ pathname: path, state }]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </UiProvider>
  )
}

describe("App route table", () => {
  it("renders the home surface at '/'", () => {
    renderAt("/")
    expect(screen.getByRole("heading", { name: "Open a PDF to start marking up" })).toBeTruthy()
  })

  it(
    "passes a picked PDF from the home route to the viewer",
    async () => {
      renderAt("/")
      const file = new File(["%PDF-1.4 truncated"], "pick.pdf", { type: "application/pdf" })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })
      await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy(), LAZY_ROUTE_WAIT)
      expect(screen.getByRole("button", { name: /open another document/i })).toBeTruthy()
    },
    LAZY_ROUTE_TEST_TIMEOUT
  )

  it("redirects '/viewer' with no handoff to home", async () => {
    renderAt("/viewer")
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Open a PDF to start marking up" })).toBeTruthy()
    )
  })

  it(
    "carries a handoff file through to the canvas's error surface",
    async () => {
      const file = new File(["%PDF-1.4 truncated"], "swap.pdf", { type: "application/pdf" })
      renderAt("/viewer", { file })
      // The viewer route mounts and the raster query fails against the
      // placeholder bytes; the alert surface is the state the query lands on.
      await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy(), LAZY_ROUTE_WAIT)
      expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy()
      expect(screen.getByRole("button", { name: /open another document/i })).toBeTruthy()
    },
    LAZY_ROUTE_TEST_TIMEOUT
  )
})
