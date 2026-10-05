import {
  atom,
  OverlayUtil,
  strokeShapeIndicators,
  type Editor,
  type TLOverlay,
  type TLShapeId
} from "tldraw"

import { ATTACH_FLASH_MS, ATTACH_OVERLAY, HELD_OVERLAY, PIN_BINDING } from "./consts"
import { isPin } from "./pin-queries"

type FeedbackKind = typeof ATTACH_OVERLAY | typeof HELD_OVERLAY

type PinFeedbackOverlay = TLOverlay<{ kind: FeedbackKind; shapeId: TLShapeId }>

/** Screen pixels. */
const UNDERLAY_WIDTH = 5
const ACCENT_WIDTH = 2
const HELD_DASH = [6, 4]

/**
 * Outlines what a pin holds, drawn on tldraw's overlay canvas:
 * - `pin-attach:<shapeId>` flashes each newly attached shape for
 *   ATTACH_FLASH_MS (the pin pings at the same time);
 * - `pin-held:<shapeId>` dashes the shapes held by a selected or hovered pin.
 */
export class PinFeedbackOverlayUtil extends OverlayUtil<PinFeedbackOverlay> {
  static override type = "pin-feedback"

  override options = { zIndex: 50 }

  /** Pin id → the shapes it just attached. */
  private readonly flashes = atom<ReadonlyMap<TLShapeId, readonly TLShapeId[]>>(
    "pin attach flashes",
    new Map()
  )

  flash(attached: ReadonlyMap<TLShapeId, readonly TLShapeId[]>) {
    for (const [pinId, shapeIds] of attached) {
      const entry = [...shapeIds]
      this.flashes.update((flashes) => new Map(flashes).set(pinId, entry))
      this.editor.timers.setTimeout(() => {
        this.flashes.update((flashes) => {
          if (flashes.get(pinId) !== entry) return flashes
          const next = new Map(flashes)
          next.delete(pinId)
          return next
        })
      }, ATTACH_FLASH_MS)
    }
  }

  isAttaching(pinId: TLShapeId): boolean {
    return this.flashes.get().has(pinId)
  }

  override isActive(): boolean {
    return this.flashes.get().size > 0 || this.featuredPins().length > 0
  }

  override getOverlays(): PinFeedbackOverlay[] {
    const flashing = new Set(
      [...this.flashes.get().values()].flat().filter((id) => this.editor.getShape(id))
    )
    const held = new Set(
      this.featuredPins().flatMap((pinId) =>
        this.editor.getBindingsFromShape(pinId, PIN_BINDING).map((binding) => binding.toId)
      )
    )
    return [
      ...[...flashing].map((shapeId) => this.overlay(ATTACH_OVERLAY, shapeId)),
      ...[...held]
        .filter((shapeId) => !flashing.has(shapeId))
        .map((shapeId) => this.overlay(HELD_OVERLAY, shapeId))
    ]
  }

  override render(ctx: CanvasRenderingContext2D, overlays: PinFeedbackOverlay[]) {
    const { editor } = this
    const zoom = editor.getZoomLevel()
    const theme = editor.getCurrentTheme().colors[editor.getColorMode()]
    const idsOf = (kind: FeedbackKind) =>
      overlays.filter((overlay) => overlay.props.kind === kind).map((o) => o.props.shapeId)
    const attached = idsOf(ATTACH_OVERLAY)
    const held = idsOf(HELD_OVERLAY)

    ctx.save()
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.strokeStyle = theme.background
    ctx.lineWidth = UNDERLAY_WIDTH / zoom
    strokeShapeIndicators(editor, ctx, [...attached, ...held])

    ctx.strokeStyle = theme.red.solid
    ctx.lineWidth = ACCENT_WIDTH / zoom
    strokeShapeIndicators(editor, ctx, attached)

    ctx.setLineDash(HELD_DASH.map((length) => length / zoom))
    strokeShapeIndicators(editor, ctx, held)
    ctx.restore()
  }

  /** Selected pins, plus the hovered one. */
  private featuredPins(): TLShapeId[] {
    const ids = new Set(this.editor.getSelectedShapeIds())
    const hovered = this.editor.getHoveredShapeId()
    if (hovered) ids.add(hovered)
    return [...ids].filter((id) => isPin(this.editor.getShape(id)))
  }

  private overlay(kind: FeedbackKind, shapeId: TLShapeId): PinFeedbackOverlay {
    return { id: `${kind}:${shapeId}`, type: PinFeedbackOverlayUtil.type, props: { kind, shapeId } }
  }
}

export function feedbackOf(editor: Editor): PinFeedbackOverlayUtil | undefined {
  return editor.overlays
    .getOverlayUtilsInZOrder()
    .find((util): util is PinFeedbackOverlayUtil => util instanceof PinFeedbackOverlayUtil)
}
