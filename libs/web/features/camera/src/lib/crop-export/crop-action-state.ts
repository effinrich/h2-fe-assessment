import { atom, type Atom, type Editor } from "tldraw"

import type { CropActionJob, CropActionState } from "../types"

import { ACTION_DONE_MS } from "../consts"
import { runCropAction, type CropActionOutcome, type CropActionRequest } from "./crop-export"

const IDLE: CropActionState = { busy: null, done: null }

// Per editor, not per toolbar: the toolbar unmounts when the frame is
// deselected, and the guard must outlive it.
const states = new WeakMap<Editor, Atom<CropActionState>>()

/** The editor's export in flight and the one that just finished, if any. */
export function getCropActionState(editor: Editor): Atom<CropActionState> {
  let state = states.get(editor)
  if (!state) {
    state = atom("crop action state", IDLE)
    states.set(editor, state)
  }
  return state
}

/**
 * Run one export per editor at a time; a request while one is in flight is
 * dropped. Not async: the export has to start in the caller's stack, or the
 * browser drops the user activation the clipboard needs.
 */
export function startCropAction(editor: Editor, request: CropActionRequest): void {
  const state = getCropActionState(editor)
  if (state.get().busy) return

  const job: CropActionJob = { frameId: request.frameId, action: request.action }
  state.set({ busy: job, done: null })

  // tldraw's export calls `document.body.focus()`; hand focus back afterwards.
  const ownerDocument = editor.getContainer().ownerDocument
  const focusedBefore = ownerDocument.activeElement
  const restoreFocus = () => {
    if (ownerDocument.activeElement !== ownerDocument.body) return
    if (focusedBefore instanceof HTMLElement && focusedBefore.isConnected) focusedBefore.focus()
  }

  const markDone = () => {
    state.update((current) => ({ ...current, done: job }))
    editor.timers.setTimeout(() => {
      state.update((current) => (current.done === job ? { ...current, done: null } : current))
    }, ACTION_DONE_MS)
  }

  // The executor runs synchronously, and turns a synchronous throw into a rejection.
  const downloadInstead = () => startCropAction(editor, { ...request, action: "download-png" })

  void new Promise<CropActionOutcome>((resolve) => {
    resolve(runCropAction(editor, request, downloadInstead))
  })
    .catch((): CropActionOutcome => "failed")
    .then((outcome) => {
      if (outcome === "done") markDone()
    })
    .finally(() => {
      state.update((current) => ({ ...current, busy: null }))
      restoreFocus()
    })
}
