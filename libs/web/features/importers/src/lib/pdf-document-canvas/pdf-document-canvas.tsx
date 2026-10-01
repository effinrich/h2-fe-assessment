import { useCallback, useRef, useState } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import { PdfDocumentEmpty } from '../pdf-document-empty/pdf-document-empty'
import { createExamplePdf } from './example'
import { placePdfOnCanvas } from './hooks'

// The whole surface: a tldraw canvas with a document on it, or the empty state
// that gets one there. The canvas mounts once and the document is rasterised
// once, so panning and zooming never re-render the page.
export function PdfDocumentCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [hasDocument, setHasDocument] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleMount = useCallback((mounted: Editor) => {
    setEditor(mounted)
  }, [])

  const place = useCallback(
    async (getFile: () => Promise<File>) => {
      if (!editor || isBusy) return
      setIsBusy(true)
      try {
        await placePdfOnCanvas(editor, await getFile())
        setHasDocument(true)
      } finally {
        setIsBusy(false)
      }
    },
    [editor, isBusy],
  )

  const onOpenPdf = useCallback(() => inputRef.current?.click(), [])
  const onUseExample = useCallback(
    () => place(createExamplePdf),
    [place],
  )

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw onMount={handleMount} />

      <input
        accept="application/pdf"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void place(async () => file)
        }}
        ref={inputRef}
        type="file"
      />

      {!hasDocument ? (
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            inset: 0,
            justifyContent: 'center',
            pointerEvents: 'none',
            position: 'absolute',
          }}
        >
          <div
            style={{
              background: 'var(--color-surface, #fff)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
              padding: 32,
              pointerEvents: 'auto',
            }}
          >
            <PdfDocumentEmpty
              isBusy={isBusy}
              onOpenPdf={onOpenPdf}
              onUseExample={onUseExample}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
