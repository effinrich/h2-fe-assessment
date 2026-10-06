import { Box, computed, type Computed, type Editor } from "tldraw"

import { CROP_FRAME } from "./consts"

function areSameBounds(a: readonly Box[], b: readonly Box[]) {
  return a.length === b.length && a.every((box, i) => b[i] !== undefined && Box.Equals(box, b[i]))
}

const cache = new WeakMap<Editor, Computed<Box[]>>()

/**
 * Page bounds of every crop frame on the current page. Reactive, and equal
 * across changes to other shapes, so a caller doesn't re-run for those.
 */
export function getCropFrameBounds(editor: Editor): Box[] {
  let bounds = cache.get(editor)
  if (!bounds) {
    bounds = computed(
      "crop frame bounds",
      () =>
        editor
          .getCurrentPageShapes()
          .filter((shape) => shape.type === CROP_FRAME)
          .flatMap((shape) => editor.getShapePageBounds(shape) ?? []),
      { isEqual: areSameBounds }
    )
    cache.set(editor, bounds)
  }
  return bounds.get()
}
