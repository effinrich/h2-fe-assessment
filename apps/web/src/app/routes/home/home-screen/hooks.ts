import { useState, type DragEvent } from "react"

import type { HomeScreenProps } from "./types"

import { carriesFiles, isPdf } from "./utils"

type FileDropOptions = Pick<HomeScreenProps, "isBusy" | "onDropFile" | "onRejectDrop">

/** Drop-anywhere: the drag-over highlight and the single-PDF check on drop. */
export function useFileDrop({ isBusy = false, onDropFile, onRejectDrop }: FileDropOptions) {
  const [dragging, setDragging] = useState(false)

  // Files are always taken (preventDefault) so a drop while busy never makes
  // the browser navigate to the file instead.
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!carriesFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = isBusy ? "none" : "copy"
    if (!isBusy) setDragging(true)
  }
  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))
      return
    setDragging(false)
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (isBusy) return
    const files = Array.from(event.dataTransfer.files)
    const [file] = files
    if (files.length === 1 && file && isPdf(file)) onDropFile(file)
    else onRejectDrop()
  }

  return { dragging, dropHandlers: { onDragLeave, onDragOver, onDrop } }
}
