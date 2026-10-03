import { useQuery } from '@tanstack/react-query'
import { renderPdf } from './utils'
import type { FileToken } from './types'

// A stable key per file: File objects don't serialise, so the query key carries
// name/size/lastModified instead — same document, same key, refetchable.
export function pdfFileToken(file: File | null): FileToken | null {
  if (!file) return null
  return `${file.name}:${file.size}:${file.lastModified}`
}

// Rasterisation is the expensive step, so: no retry storms with retry:false,
// never evicted mid-session with staleTime:Infinity, and disabled until a
// document is actually on the way.
export function usePdfPages(file: File | null) {
  return useQuery({
    enabled: file !== null,
    queryFn: async () => renderPdf(await file!.arrayBuffer()),
    queryKey: ['pdf-pages', pdfFileToken(file)],
    retry: false,
    staleTime: Infinity
  })
}
