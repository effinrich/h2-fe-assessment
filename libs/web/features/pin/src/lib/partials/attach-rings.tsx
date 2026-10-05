import { ATTACH_FLASH_MS, PIN_HEAD } from "../consts"
import { HeadRing } from "./head-ring"

const HALO_GAP = 3
const HIDDEN = { display: "none" } as const

/**
 * Right after a pin attaches: a ring that pings out from the head, or a static
 * halo just clear of the head when the user prefers reduced motion.
 */
export function AttachRings({ stroke }: { stroke: string }) {
  return (
    <>
      <HeadRing
        data-ring="ping"
        radius={PIN_HEAD.r}
        borderColor={stroke}
        animationName="ping"
        animationDuration={`${ATTACH_FLASH_MS}ms`}
        animationTimingFunction="cubic-bezier(0, 0, 0.2, 1)"
        animationFillMode="forwards"
        _motionReduce={HIDDEN}
      />
      <HeadRing
        data-ring="halo"
        radius={PIN_HEAD.r + HALO_GAP}
        borderColor={stroke}
        opacity={0.5}
        _motionSafe={HIDDEN}
      />
    </>
  )
}
