import { useRef } from "react"

/** The page field: Enter jumps to a valid page, anything else snaps back to `page`. */
export function usePageJump(
  page: number,
  totalPages: number,
  onPageChange: (page: number) => void
) {
  const pageInput = useRef<HTMLInputElement>(null)
  const jump = () => {
    const requested = Number(pageInput.current?.value)
    if (Number.isInteger(requested) && requested >= 1 && requested <= totalPages) {
      if (requested !== page) onPageChange(requested)
    } else if (pageInput.current) {
      pageInput.current.value = String(page)
    }
  }

  // Blur abandons a half-typed jump instead of performing it: clicking Next
  // blurs this field first, so committing on blur would navigate to the typed
  // page instead of the button's target.
  const abandonJump = () => {
    if (pageInput.current) pageInput.current.value = String(page)
  }

  return { pageInput, jump, abandonJump }
}
