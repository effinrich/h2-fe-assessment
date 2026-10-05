import type { ComponentType } from "react"

/** Every extension's `InFrontOfTheCanvas`, stacked in extension order. */
export function createViewerInFrontOfTheCanvas(components: readonly ComponentType[]) {
  return function ViewerInFrontOfTheCanvas() {
    return (
      <>
        {components.map((Component, index) => (
          <Component key={index} />
        ))}
      </>
    )
  }
}
