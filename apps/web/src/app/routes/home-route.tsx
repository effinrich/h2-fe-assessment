import { useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"

import { createExamplePdf, HomeScreen } from "@h2-fe/home"
import { toaster } from "@h2-fe/ui"

// The route that owns the file handoff. It holds the busy flag for the
// example-generation moment and navigates with the file in tow; the screen
// itself stays dumb.
export default function HomeRoute() {
  const navigate = useNavigate()
  const [isBusy, setIsBusy] = useState(false)

  const openViewerWith = (file: File) => {
    navigate("/viewer", { state: { file } })
  }

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (file) openViewerWith(file)
  }

  const onUseExample = async () => {
    setIsBusy(true)
    try {
      openViewerWith(await createExamplePdf())
    } catch {
      toaster.create({
        title: "The example document could not be created.",
        description: "Try again, or open your own PDF.",
        type: "error"
      })
    } finally {
      setIsBusy(false)
    }
  }

  return <HomeScreen isBusy={isBusy} onFileChange={handlePick} onUseExample={onUseExample} />
}
