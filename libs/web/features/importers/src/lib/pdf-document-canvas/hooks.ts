import type { Editor } from 'tldraw'
import { AssetRecordType } from 'tldraw'
import { renderPdf } from './utils'

// Every page becomes its own locked image shape, laid out one below the next
// with a gap. Locked because a page is the paper, not a thing you drag around.
export async function placePdfOnCanvas(editor: Editor, file: File): Promise<void> {
  const summary = await renderPdf(await file.arrayBuffer())

  const GAP = 40
  let y = 0

  const assets = summary.pages.map(page =>
    AssetRecordType.create({
      type: 'image',
      meta: {},
      props: {
        name: `page-${page.pageNumber}.png`,
        src: page.dataUrl,
        w: page.width,
        h: page.height,
        mimeType: 'image/png',
        isAnimated: false
      }
    })
  )

  editor.createAssets(assets)

  const shapes = summary.pages.map((page, index) => {
    const asset = assets[index]
    const shape = {
      type: 'image' as const,
      x: 0,
      y,
      isLocked: true,
      props: {
        assetId: asset.id,
        w: page.width,
        h: page.height
      }
    }
    y += page.height + GAP
    return shape
  })

  editor.createShapes(shapes)
  editor.zoomToFit({ animation: { duration: 200 } })
}

export function usePdfPlacement(editor: Editor | null) {
  return async (file: File) => {
    if (!editor) return
    await placePdfOnCanvas(editor, file)
  }
}
