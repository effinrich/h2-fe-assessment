import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

/** Back home. With unsaved marks, ask first; refresh/close prompts while marked. */
export function useLeaveGuard() {
  const navigate = useNavigate()
  const [hasMarks, setHasMarks] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const leave = useCallback(() => navigate("/", { replace: true }), [navigate])
  const onOpenAnother = useCallback(() => {
    if (hasMarks) setConfirmExit(true)
    else leave()
  }, [hasMarks, leave])

  useEffect(() => {
    if (!hasMarks) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasMarks])

  return { setHasMarks, confirmExit, setConfirmExit, onOpenAnother, leave }
}
