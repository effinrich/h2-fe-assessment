import type * as TldrawModule from "tldraw"

import { useEffect } from "react"
import { vi } from "vitest"

/** What the stubbed `<Tldraw>` last received, and the editor it hands to `onMount`. */
export const tldrawStub: { props: TldrawModule.TldrawProps | null; editor: object | null } = {
  props: null,
  editor: null
}

export function resetTldrawStub() {
  tldrawStub.props = null
  tldrawStub.editor = null
}

/**
 * The `tldraw` module for jsdom specs: `<Tldraw>` records its props and mounts
 * `tldrawStub.editor`. tldraw's signals stay real so reactive viewport code is
 * exercised as it runs in the app.
 */
export async function createTldrawStub() {
  const { atom, react, unsafe__withoutCapture, DEFAULT_THEME } =
    await vi.importActual<typeof TldrawModule>("tldraw")
  return {
    DEFAULT_THEME,
    atom,
    react,
    unsafe__withoutCapture,
    AssetRecordType: { create: (input: Record<string, unknown>) => input },
    Tldraw: (props: TldrawModule.TldrawProps) => {
      tldrawStub.props = props
      // Like tldraw: the latest onMount runs once per mount.
      useEffect(() => {
        if (!tldrawStub.editor) return undefined
        return tldrawStub.props?.onMount?.(tldrawStub.editor as TldrawModule.Editor) ?? undefined
      }, [])
      return <div data-testid="tldraw" />
    }
  }
}
