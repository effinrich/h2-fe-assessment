import { useQuery } from "@tanstack/react-query"

import type { FileToken } from "./types"

import { openPdf } from "./utils"

const fileTokens = new WeakMap<File, string>()
let nextFileToken = 0

export function pdfFileToken(file: File | null): FileToken | null {
  if (!file) return null
  let token = fileTokens.get(file)
  if (!token) {
    token = `pdf-${nextFileToken++}`
    fileTokens.set(file, token)
  }
  return token
}

// Rasterisation is the expensive step, so: no retry storms with retry:false,
// never evicted mid-session with staleTime:Infinity, and disabled until a
// document is actually on the way.
export function usePdfPages(file: File | null) {
  return useQuery({
    enabled: file !== null,
    queryFn: async ({ signal }) => {
      const data = await file!.arrayBuffer()
      if (signal.aborted) throw signal.reason
      const document = await openPdf(data)
      if (signal.aborted) await document.destroy()
      return document
    },
    queryKey: ["pdf-pages", pdfFileToken(file)],
    retry: false,
    staleTime: Infinity,
    gcTime: 0
  })
}
