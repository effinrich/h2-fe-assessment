import type { DragEvent } from "react"

export function isPdf(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name)
}

export function carriesFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files")
}
