# Write a story with a play test

Stories are the component tests here. A story renders, runs its `play` function, and is checked for accessibility (axe, level `error`) in headless Chromium. Chromatic snapshots it too.

## Where the file goes

| What you test             | Story location                         | Storybook                            |
| ------------------------- | -------------------------------------- | ------------------------------------ |
| A design-system component | next to it in `libs/shared/ui/src/lib` | `shared-ui` (port 4400)              |
| A web-scoped component    | `libs/web/ui/src/lib`                  | `@h2-fe/web-ui` (`storybook:web`)    |
| A feature (tool, screen)  | `libs/web/features/<name>/src/lib`     | web stage, also published via shared |
| The home route            | `apps/web/src/app/routes/home`         | web stage                            |

Name it `<thing>.stories.tsx`. File names are kebab-case (lint enforces it). Titles for features follow `Features/<Name>/<Area>`, for example `Features/Pin/Tool`.

## Template for a canvas feature

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"

import { expect, waitFor } from "storybook/test"
import { Tldraw, tleditors, type Editor } from "tldraw"

import { Box } from "@h2-fe/ui"
import "tldraw/tldraw.css"

const meta = {
  title: "Features/Thing/Behaviour",
  render: () => (
    <Box position="fixed" inset="0">
      <Tldraw />
    </Box>
  )
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const DoesTheThing: Story = {
  play: async ({ canvasElement, userEvent }) => {
    // arrange, act through the UI, assert on editor state
  }
}
```

Get the editor for the story's own canvas with `tleditors.getMounted()`, filtered by `canvasElement.contains(editor.getContainer())`, inside `waitFor`. Pin's `story-helpers.ts` has a `mountedEditor` helper and pointer helpers (`clickAt`, `dragFrom`) worth copying into your lib.

For a full example, read `libs/web/features/pin/src/lib/pin-tool.stories.tsx`.

## Rules of thumb

- **One story per acceptance criterion**, named after it: `FirstUseHint`, `ToolbarEntry`. The spec line cites the story.
- **Drive the real UI.** Press keys and pointer events with the `userEvent` from the play context; assert on editor state or accessible roles.
- **Focus the container before keyboard shortcuts**: `editor.getContainer().focus()`.
- **Clear state in `beforeEach`.** Anything the component keeps in `sessionStorage` or `localStorage` will leak between stories otherwise.
- **No network.** Stories use a stub query client so Chromatic snapshots stay deterministic ([ADR 0007](../decisions/0007-storybook-scope.md)).
- **Verify tldraw calls against the installed types** (`node_modules/tldraw/.../index.d.ts`). Do not rely on memory of the API.
- **Locked shapes ignore edits** unless wrapped in `editor.run(..., { ignoreShapeLock: true })`.
- Pure logic with no UI (geometry, filename building) gets a `*.spec.ts` instead.

## Run it

Everything, as the gate does:

```sh
bunx nx run @h2-fe/web-ui:test-storybook
```

First time only:

```sh
bunx playwright install chromium
```

One story while you iterate, from `libs/web/ui`:

```sh
bunx vitest run --config vitest.storybook.config.mts -t "<story or test name>"
```

That is the same config `test-storybook` uses, filtered by name.

To look at it, run `bun run storybook:web` (or `bun run storybook` for the design system).

## Feature stories and `affected`

web-ui and shared-ui do not import features, so their `test-storybook` and `build-storybook` inputs list the feature story files. A feature-only change therefore still marks those targets affected. Keep those inputs; do not make `libs/shared/ui` import `scope:web`.
