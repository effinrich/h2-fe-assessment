import {
  createShapeId,
  StateNode,
  type Editor,
  type TLOnMountHandler,
  type TLStateNodeConstructor,
  type TLUiOverrides
} from "tldraw"

export const MARKER_TOOL_ID = "marker"
export const MARKER_KBD = "m"
export const MARKER_LABEL_KEY = "tool.marker"
export const MARKER_LABEL = "Marker"
export const MARKER_SIZE = 24

class MarkerIdle extends StateNode {
  static override id = "idle"

  override onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 })
  }

  override onPointerDown() {
    const { editor } = this
    const point = editor.inputs.getCurrentPagePoint()
    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating:${id}`)
    editor.run(() => {
      editor.createShape({
        id,
        type: "geo",
        x: point.x - MARKER_SIZE / 2,
        y: point.y - MARKER_SIZE / 2,
        props: { geo: "ellipse", w: MARKER_SIZE, h: MARKER_SIZE, color: "red", fill: "solid" }
      })
      editor.select(id)
    })
    editor.setCurrentTool("select")
  }

  override onCancel() {
    this.editor.setCurrentTool("select")
  }
}

class MarkerTool extends StateNode {
  static override id = MARKER_TOOL_ID
  static override initial = "idle"
  static override children = () => [MarkerIdle]
}

export interface MarkerExtension {
  toolIds: readonly string[]
  tools: readonly TLStateNodeConstructor[]
  overrides: TLUiOverrides
  onMount?: TLOnMountHandler
}

export function createMarkerExtension(): MarkerExtension {
  return {
    toolIds: [MARKER_TOOL_ID],
    tools: [MarkerTool],
    overrides: {
      tools: (editor: Editor, tools) => ({
        ...tools,
        [MARKER_TOOL_ID]: {
          id: MARKER_TOOL_ID,
          label: MARKER_LABEL_KEY,
          icon: "geo-ellipse",
          kbd: MARKER_KBD,
          onSelect: () => editor.setCurrentTool(MARKER_TOOL_ID)
        }
      }),
      translations: { en: { [MARKER_LABEL_KEY]: MARKER_LABEL } }
    }
  }
}
