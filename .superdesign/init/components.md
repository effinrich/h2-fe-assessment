# Components

Superdesign init: the reusable UI components of `h2-fe-assessment` ("Annotate PDF"), with full source.

## Stack

- **React 19** + **TypeScript (strict)**, bundled by **Vite 8**. Nx 23 monorepo, bun workspaces.
- **Chakra UI v3** (`@chakra-ui/react` 3.37) is the styling system for app chrome. Styling is done the Chakra way: **style props on Chakra components, slot recipes, and semantic tokens** (`bg.panel`, `fg`, `border`, `brand.solid`, ...). There is **no Tailwind** and no CSS modules. Our own chrome elements are made with `chakra("div", { base: {...} })` factories.
- One custom palette, `brand` (a green-grey scale), set as the global `colorPalette` on `<html>`, so every Chakra component defaults to it. See `theme.md`.
- Colour mode: `next-themes` writes `.light` / `.dark` on `<html>`; Chakra's `_dark` condition follows it. `ColorModeButton` toggles it.
- Icons: `lucide-react`.
- **tldraw v5** (5.5) renders the document canvas (the `/viewer` route). tldraw has its own CSS (`tldraw/tldraw.css`) and UI kit (`TldrawUi*`). Chakra tokens are bridged into tldraw via CSS variables (`tldraw-theme.css`). Stock tldraw chrome is never wrapped in `chakra()`.
- **pdfjs-dist** rasterises PDF pages into tldraw image shapes; **pdf-lib** draws the "Use an example" PDF.
- Data: TanStack Query (`usePdfPages`). Routing: React Router 6.

## Where components live

| Package                       | Path                               | Role                                                                          |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `@h2-fe/ui`                   | `libs/shared/ui/src`               | Design system: Chakra system, provider, thin wrappers, re-exported primitives |
| `@h2-fe/web-ui`               | `libs/web/ui/src`                  | Web chrome: `ViewerTopBar`                                                    |
| `@h2-fe/pdf-viewer`           | `libs/web/features/pdf-viewer/src` | Viewer screen + chrome factories (see `layouts.md`)                           |
| `@h2-fe/pin`, `@h2-fe/camera` | `libs/web/features/<name>/src`     | tldraw canvas extensions; their on-canvas UI is in the appendix below         |

Everything is consumed as named imports from the package barrel, e.g. `import { Button, Modal } from "@h2-fe/ui"`.

## Barrel: `@h2-fe/ui`

`libs/shared/ui/src/index.ts` (40 lines)

```ts
export * from "./lib/theme/system"
export * from "./lib/provider/provider"
export * from "./lib/color-mode-button/color-mode-button"
export { useColorMode } from "./lib/color-mode-button/hooks"
export type { ColorMode, UseColorModeReturn } from "./lib/color-mode-button/types"
export * from "./lib/text-field/text-field"
export * from "./lib/modal/modal"
export * from "./lib/tooltip/tooltip"
export * from "./lib/toaster/toaster"
export * from "./lib/toaster/consts"
export * from "./lib/button/button"

// Primitives: re-exported from Chakra unchanged.
export * from "./lib/primitives/layout"
export * from "./lib/primitives/typography"
export * from "./lib/primitives/buttons"
export * from "./lib/primitives/forms"
export * from "./lib/primitives/feedback"
export * from "./lib/primitives/data-display"

// Compound components: thin wrappers with a props-driven API.
export * from "./lib/checkbox/checkbox"
export * from "./lib/radio-group/radio-group"
export * from "./lib/switch/switch"
export * from "./lib/native-select/native-select"
export * from "./lib/select/select"
export * from "./lib/number-input/number-input"
export * from "./lib/alert/alert"
export * from "./lib/progress/progress"
export * from "./lib/empty-state/empty-state"
export * from "./lib/avatar/avatar"
export * from "./lib/stat/stat"
export * from "./lib/tag/tag"
export * from "./lib/menu/menu"
export * from "./lib/popover/popover"
export * from "./lib/drawer/drawer"
export * from "./lib/tabs/tabs"
export * from "./lib/accordion/accordion"
export * from "./lib/breadcrumb/breadcrumb"
export * from "./lib/pagination/pagination"
```

---

## Provider

### UiProvider

- **Path:** `libs/shared/ui/src/lib/provider/provider.tsx`
- **Description:** Root provider: `ChakraProvider` with the custom `system`, `next-themes` class-based colour mode, and the global `<Toaster />`.
- **Key props:** `children: ReactNode`.

`libs/shared/ui/src/lib/provider/provider.tsx` (24 lines)

```tsx
import type { ReactNode } from "react"

import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"

import { system } from "../theme/system"
import { Toaster } from "../toaster/toaster"

export interface UiProviderProps {
  children: ReactNode
}

// Chakra's dark condition matches a `.dark` ancestor, so next-themes writes the
// colour mode as a class on <html>.
export function UiProvider({ children }: UiProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </ChakraProvider>
  )
}
```

---

## Buttons

### Button

- **Path:** `libs/shared/ui/src/lib/button/button.tsx`
- **Description:** `forwardRef` pass-through over Chakra `Button`; inherits the Chakra button recipe.
- **Key props:** all Chakra `ButtonProps`. `variant`: `solid` (default) | `subtle` | `surface` | `outline` | `ghost` | `plain`. `size`: `2xs` | `xs` | `sm` | `md` (default) | `lg` | `xl` | `2xl`. `colorPalette` (defaults to `brand` globally; `red` is used for destructive), `disabled`, `loading`, `w`.
- **In use:** home uses `solid` (Open PDF) and `outline` (Use an example), full width. Viewer top bar uses `outline` `sm` (Previous/Next) and `outline` md (Open another document). Leave dialog: default solid "Keep working" + `colorPalette="red" variant="outline"` "Discard marks".

`libs/shared/ui/src/lib/button/button.tsx` (17 lines)

```tsx
import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import { forwardRef, type ReactNode } from "react"

export interface ButtonProps extends ChakraButtonProps {
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, ...props },
  ref
) {
  return (
    <ChakraButton ref={ref} {...props}>
      {children}
    </ChakraButton>
  )
})
```

### ColorModeButton

- **Path:** `libs/shared/ui/src/lib/color-mode-button/color-mode-button.tsx` (+ `hooks.ts`, `types.ts`)
- **Description:** Ghost `sm` icon button toggling light/dark (Sun icon in light, Moon in dark); label flips accordingly.
- **Key props:** any `IconButtonProps` except `aria-label` / `onClick` (e.g. `position`, `top`, `right`). Hook: `useColorMode()` returns `{ colorMode, setColorMode, toggleColorMode }`.

`libs/shared/ui/src/lib/color-mode-button/color-mode-button.tsx` (23 lines)

```tsx
import { Icon, IconButton, type IconButtonProps } from "@chakra-ui/react"
import { Moon, Sun } from "lucide-react"

import { useColorMode } from "./hooks"

export type ColorModeButtonProps = Omit<IconButtonProps, "aria-label" | "onClick">

export function ColorModeButton(props: ColorModeButtonProps) {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"

  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleColorMode}
      {...props}
    >
      <Icon asChild>{isDark ? <Moon /> : <Sun />}</Icon>
    </IconButton>
  )
}
```

`libs/shared/ui/src/lib/color-mode-button/hooks.ts` (15 lines)

```ts
import { useTheme } from "next-themes"
import { useCallback } from "react"

import type { ColorMode, UseColorModeReturn } from "./types"

export function useColorMode(): UseColorModeReturn {
  const { resolvedTheme, forcedTheme, setTheme } = useTheme()
  const colorMode: ColorMode = (forcedTheme ?? resolvedTheme) === "dark" ? "dark" : "light"

  const toggleColorMode = useCallback(() => {
    setTheme(colorMode === "dark" ? "light" : "dark")
  }, [colorMode, setTheme])

  return { colorMode, setColorMode: setTheme, toggleColorMode }
}
```

`libs/shared/ui/src/lib/color-mode-button/types.ts` (7 lines)

```ts
export type ColorMode = "light" | "dark"

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}
```

---

## Overlays

### Modal

- **Path:** `libs/shared/ui/src/lib/modal/modal.tsx`
- **Description:** Chakra `Dialog` wrapper: backdrop, header title, body, optional footer, close button. Lazy-mounted.
- **Key props:** `title`, `children`, `footer?`, `trigger?` (uncontrolled) or `open` + `onOpenChange` (controlled), `defaultOpen`, `size`, `closeLabel` (default "Close").

`libs/shared/ui/src/lib/modal/modal.tsx` (56 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { CloseButton, Dialog, Portal } from "@chakra-ui/react"

export interface ModalProps {
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** A single element that opens the modal; omit it to control `open` yourself. */
  trigger?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  size?: Dialog.RootProps["size"]
  closeLabel?: string
}

export function Modal({
  title,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  size,
  closeLabel = "Close"
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      size={size}
      lazyMount
      unmountOnExit
    >
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            {footer ? <Dialog.Footer>{footer}</Dialog.Footer> : null}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={closeLabel} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
```

### Drawer

- **Path:** `libs/shared/ui/src/lib/drawer/drawer.tsx`
- **Description:** Chakra `Drawer` wrapper with the same API as `Modal`, sliding from an edge.
- **Key props:** as `Modal`, plus `placement` (default `"end"`).

`libs/shared/ui/src/lib/drawer/drawer.tsx` (59 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { CloseButton, Drawer as ChakraDrawer, Portal } from "@chakra-ui/react"

export interface DrawerProps {
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** A single element that opens the drawer; omit it to control `open` yourself. */
  trigger?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: ChakraDrawer.RootProps["placement"]
  size?: ChakraDrawer.RootProps["size"]
  closeLabel?: string
}

export function Drawer({
  title,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  placement = "end",
  size,
  closeLabel = "Close"
}: DrawerProps) {
  return (
    <ChakraDrawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      placement={placement}
      size={size}
      lazyMount
      unmountOnExit
    >
      {trigger ? <ChakraDrawer.Trigger asChild>{trigger}</ChakraDrawer.Trigger> : null}
      <Portal>
        <ChakraDrawer.Backdrop />
        <ChakraDrawer.Positioner>
          <ChakraDrawer.Content>
            <ChakraDrawer.Header>
              <ChakraDrawer.Title>{title}</ChakraDrawer.Title>
            </ChakraDrawer.Header>
            <ChakraDrawer.Body>{children}</ChakraDrawer.Body>
            {footer ? <ChakraDrawer.Footer>{footer}</ChakraDrawer.Footer> : null}
            <ChakraDrawer.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={closeLabel} />
            </ChakraDrawer.CloseTrigger>
          </ChakraDrawer.Content>
        </ChakraDrawer.Positioner>
      </Portal>
    </ChakraDrawer.Root>
  )
}
```

### Popover

- **Path:** `libs/shared/ui/src/lib/popover/popover.tsx`
- **Description:** Chakra `Popover` wrapper: trigger, optional title/arrow/footer.
- **Key props:** `trigger: ReactElement`, `title?`, `children`, `footer?`, `showArrow?`, `onOpenChange?(open)`, plus Chakra popover root props.

`libs/shared/ui/src/lib/popover/popover.tsx` (47 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { Popover as ChakraPopover, Portal } from "@chakra-ui/react"

export interface PopoverProps extends Omit<ChakraPopover.RootProps, "children" | "onOpenChange"> {
  /** A single element that opens the popover. */
  trigger: ReactElement
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  showArrow?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  title,
  children,
  footer,
  showArrow = false,
  onOpenChange,
  ...rootProps
}: PopoverProps) {
  return (
    <ChakraPopover.Root {...rootProps} onOpenChange={(details) => onOpenChange?.(details.open)}>
      <ChakraPopover.Trigger asChild>{trigger}</ChakraPopover.Trigger>
      <Portal>
        <ChakraPopover.Positioner>
          <ChakraPopover.Content>
            {showArrow ? (
              <ChakraPopover.Arrow>
                <ChakraPopover.ArrowTip />
              </ChakraPopover.Arrow>
            ) : null}
            {title ? (
              <ChakraPopover.Header>
                <ChakraPopover.Title fontWeight="medium">{title}</ChakraPopover.Title>
              </ChakraPopover.Header>
            ) : null}
            <ChakraPopover.Body>{children}</ChakraPopover.Body>
            {footer ? <ChakraPopover.Footer>{footer}</ChakraPopover.Footer> : null}
          </ChakraPopover.Content>
        </ChakraPopover.Positioner>
      </Portal>
    </ChakraPopover.Root>
  )
}
```

### Tooltip

- **Path:** `libs/shared/ui/src/lib/tooltip/tooltip.tsx`
- **Description:** Chakra `Tooltip` wrapper attached to a single focusable child (no wrapper element). Renders the bare child when `disabled`.
- **Key props:** `content`, `children: ReactElement`, `showArrow?`, `disabled?`, plus Chakra tooltip root props (`openDelay`, `positioning`, ...).

`libs/shared/ui/src/lib/tooltip/tooltip.tsx` (38 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { Portal, Tooltip as ChakraTooltip } from "@chakra-ui/react"

export interface TooltipProps extends Omit<ChakraTooltip.RootProps, "children"> {
  content: ReactNode
  /** A single focusable element; the tooltip attaches to it rather than wrapping it. */
  children: ReactElement
  showArrow?: boolean
}

export function Tooltip({
  content,
  children,
  showArrow = false,
  disabled,
  ...rootProps
}: TooltipProps) {
  if (disabled) return children

  return (
    <ChakraTooltip.Root {...rootProps}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content>
            {showArrow ? (
              <ChakraTooltip.Arrow>
                <ChakraTooltip.ArrowTip />
              </ChakraTooltip.Arrow>
            ) : null}
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  )
}
```

### Menu

- **Path:** `libs/shared/ui/src/lib/menu/menu.tsx`
- **Description:** Props-driven Chakra `Menu`: list of items with optional keyboard hint and destructive styling.
- **Key props:** `trigger`, `items: { value, label, command?, disabled?, danger? }[]`, `onSelect?(value)`.

`libs/shared/ui/src/lib/menu/menu.tsx` (48 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { Menu as ChakraMenu, Portal } from "@chakra-ui/react"

export interface MenuOption {
  value: string
  label: ReactNode
  /** Keyboard hint shown at the end of the item, e.g. "⌘E". */
  command?: string
  disabled?: boolean
  /** Styles the item as destructive. */
  danger?: boolean
}

export interface MenuProps extends Omit<ChakraMenu.RootProps, "children" | "onSelect"> {
  /** A single button element that opens the menu. */
  trigger: ReactElement
  items: MenuOption[]
  onSelect?: (value: string) => void
}

export function Menu({ trigger, items, onSelect, ...rootProps }: MenuProps) {
  return (
    <ChakraMenu.Root {...rootProps} onSelect={(details) => onSelect?.(details.value)}>
      <ChakraMenu.Trigger asChild>{trigger}</ChakraMenu.Trigger>
      <Portal>
        <ChakraMenu.Positioner>
          <ChakraMenu.Content>
            {items.map((item) => (
              <ChakraMenu.Item
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                color={item.danger ? "fg.error" : undefined}
                _hover={item.danger ? { bg: "bg.error", color: "fg.error" } : undefined}
              >
                {item.label}
                {item.command ? (
                  <ChakraMenu.ItemCommand>{item.command}</ChakraMenu.ItemCommand>
                ) : null}
              </ChakraMenu.Item>
            ))}
          </ChakraMenu.Content>
        </ChakraMenu.Positioner>
      </Portal>
    </ChakraMenu.Root>
  )
}
```

### Toaster / toaster

- **Path:** `libs/shared/ui/src/lib/toaster/toaster.tsx`, `libs/shared/ui/src/lib/toaster/consts.ts`
- **Description:** Global toast region (top-end, `sm` width on md+, inset on mobile). Spinner for `loading` toasts, status indicator otherwise; description opacity forced to 1 for AA contrast. Mounted once by `UiProvider`.
- **Key props:** none on `<Toaster />`. Imperative API: `toaster.create({ title, description?, type: "success" | "error" | "warning" | "info" | "loading", action?, closable? })`.

`libs/shared/ui/src/lib/toaster/toaster.tsx` (35 lines)

```tsx
import { Toaster as ChakraToaster, Portal, Spinner, Stack, Toast } from "@chakra-ui/react"

import { toaster } from "./consts"

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }}>
            {toast.type === "loading" ? (
              <Spinner size="sm" color="colorPalette.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title ? <Toast.Title>{toast.title}</Toast.Title> : null}
              {toast.description ? (
                // Chakra dims the description to 0.8, which fails AA contrast
                // on the coloured success/warning/error toasts.
                <Toast.Description opacity="1">{toast.description}</Toast.Description>
              ) : null}
            </Stack>
            {toast.action ? (
              <Toast.ActionTrigger onClick={toast.action.onClick}>
                {toast.action.label}
              </Toast.ActionTrigger>
            ) : null}
            {toast.closable ? <Toast.CloseTrigger /> : null}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
```

`libs/shared/ui/src/lib/toaster/consts.ts` (6 lines)

```ts
import { createToaster } from "@chakra-ui/react"

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true
})
```

---

## Feedback and data display

### EmptyState

- **Path:** `libs/shared/ui/src/lib/empty-state/empty-state.tsx`
- **Description:** Chakra `EmptyState`: optional icon, centred title and description, actions as children.
- **Key props:** `title`, `description?`, `icon?`, `children?` (actions), plus `size` etc. from Chakra root props.

`libs/shared/ui/src/lib/empty-state/empty-state.tsx` (28 lines)

```tsx
import type { ReactNode } from "react"

import { EmptyState as ChakraEmptyState, VStack } from "@chakra-ui/react"

export interface EmptyStateProps extends Omit<ChakraEmptyState.RootProps, "title"> {
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  /** Actions shown under the text, e.g. a "Create" button. */
  children?: ReactNode
}

export function EmptyState({ title, description, icon, children, ...rootProps }: EmptyStateProps) {
  return (
    <ChakraEmptyState.Root {...rootProps}>
      <ChakraEmptyState.Content>
        {icon ? <ChakraEmptyState.Indicator>{icon}</ChakraEmptyState.Indicator> : null}
        <VStack textAlign="center">
          <ChakraEmptyState.Title>{title}</ChakraEmptyState.Title>
          {description ? (
            <ChakraEmptyState.Description>{description}</ChakraEmptyState.Description>
          ) : null}
        </VStack>
        {children}
      </ChakraEmptyState.Content>
    </ChakraEmptyState.Root>
  )
}
```

### Alert

- **Path:** `libs/shared/ui/src/lib/alert/alert.tsx`
- **Description:** Chakra `Alert` with title, optional description, custom icon and trailing action.
- **Key props:** `title`, `children?` (description), `icon?`, `action?`, `status` (`info` | `success` | `warning` | `error` | `neutral`), `variant`.

`libs/shared/ui/src/lib/alert/alert.tsx` (26 lines)

```tsx
import type { ReactElement, ReactNode } from "react"

import { Alert as ChakraAlert } from "@chakra-ui/react"

export interface AlertProps extends Omit<ChakraAlert.RootProps, "title"> {
  title: ReactNode
  /** Optional description under the title. */
  children?: ReactNode
  /** Replaces the status icon. */
  icon?: ReactElement
  /** Rendered at the end of the alert, e.g. a dismiss or retry button. */
  action?: ReactNode
}

export function Alert({ title, children, icon, action, ...rootProps }: AlertProps) {
  return (
    <ChakraAlert.Root {...rootProps}>
      {icon ? <ChakraAlert.Indicator>{icon}</ChakraAlert.Indicator> : <ChakraAlert.Indicator />}
      <ChakraAlert.Content>
        <ChakraAlert.Title>{title}</ChakraAlert.Title>
        {children ? <ChakraAlert.Description>{children}</ChakraAlert.Description> : null}
      </ChakraAlert.Content>
      {action}
    </ChakraAlert.Root>
  )
}
```

### Progress

- **Path:** `libs/shared/ui/src/lib/progress/progress.tsx`
- **Description:** Linear progress bar with optional label and percentage; `value={null}` is indeterminate.
- **Key props:** `value`, `label?`, `showValueText?`, `size`, `striped`, `animated`.

`libs/shared/ui/src/lib/progress/progress.tsx` (26 lines)

```tsx
import type { ReactNode } from "react"

import { HStack, Progress as ChakraProgress } from "@chakra-ui/react"

export interface ProgressProps extends Omit<ChakraProgress.RootProps, "children"> {
  label?: ReactNode
  /** Shows the percentage next to the label. */
  showValueText?: boolean
}

/** Pass `value={null}` for an indeterminate bar. */
export function Progress({ label, showValueText = false, ...rootProps }: ProgressProps) {
  return (
    <ChakraProgress.Root {...rootProps}>
      {label || showValueText ? (
        <HStack justify="space-between" mb="2">
          {label ? <ChakraProgress.Label>{label}</ChakraProgress.Label> : <span />}
          {showValueText ? <ChakraProgress.ValueText /> : null}
        </HStack>
      ) : null}
      <ChakraProgress.Track>
        <ChakraProgress.Range />
      </ChakraProgress.Track>
    </ChakraProgress.Root>
  )
}
```

### Avatar

- **Path:** `libs/shared/ui/src/lib/avatar/avatar.tsx`
- **Description:** Chakra `Avatar` with initials fallback, optional image and icon.
- **Key props:** `name?`, `src?`, `srcSet?`, `loading?`, `icon?`, `size`, `shape`.

`libs/shared/ui/src/lib/avatar/avatar.tsx` (25 lines)

```tsx
import type { ImgHTMLAttributes, ReactElement } from "react"

import { Avatar as ChakraAvatar } from "@chakra-ui/react"

export interface AvatarProps extends ChakraAvatar.RootProps {
  /** Used for the initials fallback and the image's alt text. */
  name?: string
  src?: string
  srcSet?: string
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"]
  /** Shown instead of initials when there is no `name`. */
  icon?: ReactElement
}

export function Avatar({ name, src, srcSet, loading, icon, children, ...rootProps }: AvatarProps) {
  return (
    <ChakraAvatar.Root {...rootProps}>
      <ChakraAvatar.Fallback name={name}>{icon}</ChakraAvatar.Fallback>
      {src || srcSet ? (
        <ChakraAvatar.Image src={src} srcSet={srcSet} loading={loading} alt={name} />
      ) : null}
      {children}
    </ChakraAvatar.Root>
  )
}
```

### Stat

- **Path:** `libs/shared/ui/src/lib/stat/stat.tsx`
- **Description:** Labelled value with unit, help text, and an up/down trend badge (green/red).
- **Key props:** `label`, `value`, `unit?`, `helpText?`, `trend?: { direction: "up" | "down"; value }`.

`libs/shared/ui/src/lib/stat/stat.tsx` (44 lines)

```tsx
import type { ReactNode } from "react"

import { Badge, Stat as ChakraStat } from "@chakra-ui/react"

export interface StatTrend {
  direction: "up" | "down"
  value: ReactNode
}

export interface StatProps extends ChakraStat.RootProps {
  label: ReactNode
  value: ReactNode
  unit?: ReactNode
  helpText?: ReactNode
  /** Rendered as a green (up) or red (down) badge after the value. */
  trend?: StatTrend
}

// Stat.Root is a <dl>: its direct children must be <dt>/<dd>, so the trend
// badge lives inside the value's <dd> and the help text renders as a <dd>.
export function Stat({ label, value, unit, helpText, trend, ...rootProps }: StatProps) {
  return (
    <ChakraStat.Root {...rootProps}>
      <ChakraStat.Label>{label}</ChakraStat.Label>
      <ChakraStat.ValueText alignItems="center" gap="2">
        <span>
          {value}
          {unit ? <ChakraStat.ValueUnit ms="1">{unit}</ChakraStat.ValueUnit> : null}
        </span>
        {trend ? (
          <Badge colorPalette={trend.direction === "up" ? "green" : "red"} gap="0">
            {trend.direction === "up" ? <ChakraStat.UpIndicator /> : <ChakraStat.DownIndicator />}
            {trend.value}
          </Badge>
        ) : null}
      </ChakraStat.ValueText>
      {helpText ? (
        <ChakraStat.HelpText asChild>
          <dd>{helpText}</dd>
        </ChakraStat.HelpText>
      ) : null}
    </ChakraStat.Root>
  )
}
```

### Tag

- **Path:** `libs/shared/ui/src/lib/tag/tag.tsx`
- **Description:** Chakra `Tag` with start/end elements and an optional remove button.
- **Key props:** `children` (label), `startElement?`, `endElement?`, `onClose?`, `closeLabel` (default "Remove"), `variant`, `size`.

`libs/shared/ui/src/lib/tag/tag.tsx` (33 lines)

```tsx
import type { ReactNode } from "react"

import { Tag as ChakraTag } from "@chakra-ui/react"

export interface TagProps extends ChakraTag.RootProps {
  startElement?: ReactNode
  endElement?: ReactNode
  /** Renders a remove button that calls this. */
  onClose?: () => void
  closeLabel?: string
}

export function Tag({
  startElement,
  endElement,
  onClose,
  closeLabel = "Remove",
  children,
  ...rootProps
}: TagProps) {
  return (
    <ChakraTag.Root {...rootProps}>
      {startElement ? <ChakraTag.StartElement>{startElement}</ChakraTag.StartElement> : null}
      <ChakraTag.Label>{children}</ChakraTag.Label>
      {endElement ? <ChakraTag.EndElement>{endElement}</ChakraTag.EndElement> : null}
      {onClose ? (
        <ChakraTag.EndElement>
          <ChakraTag.CloseTrigger aria-label={closeLabel} onClick={onClose} />
        </ChakraTag.EndElement>
      ) : null}
    </ChakraTag.Root>
  )
}
```

---

## Forms

### TextField

- **Path:** `libs/shared/ui/src/lib/text-field/text-field.tsx`
- **Description:** Labelled `Input` inside `Field.Root` with required indicator, helper and error text.
- **Key props:** `label`, `helperText?`, `errorText?` (sets invalid), `required`, `disabled`, `readOnly`, plus `InputProps`.

`libs/shared/ui/src/lib/text-field/text-field.tsx` (37 lines)

```tsx
import type { ReactNode } from "react"

import { Field, Input, type InputProps } from "@chakra-ui/react"

export interface TextFieldProps extends InputProps {
  label: ReactNode
  helperText?: ReactNode
  /** Marks the field invalid and is announced as the input's description. */
  errorText?: ReactNode
}

export function TextField({
  label,
  helperText,
  errorText,
  required,
  disabled,
  readOnly,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field.Root
      invalid={Boolean(errorText)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Field.Label>
        {label}
        <Field.RequiredIndicator />
      </Field.Label>
      <Input {...inputProps} />
      {helperText ? <Field.HelperText>{helperText}</Field.HelperText> : null}
      <Field.ErrorText>{errorText}</Field.ErrorText>
    </Field.Root>
  )
}
```

### Checkbox

- **Path:** `libs/shared/ui/src/lib/checkbox/checkbox.tsx`
- **Description:** Chakra `Checkbox` with label as children.
- **Key props:** `children?`, `checked`, `defaultChecked`, `onCheckedChange?(checked | "indeterminate")`, `disabled`.

`libs/shared/ui/src/lib/checkbox/checkbox.tsx` (26 lines)

```tsx
import type { ReactNode } from "react"

import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"

export type CheckboxCheckedState = ChakraCheckbox.CheckedChangeDetails["checked"]

export interface CheckboxProps extends Omit<ChakraCheckbox.RootProps, "onCheckedChange"> {
  /** The checkbox's label. */
  children?: ReactNode
  onCheckedChange?: (checked: CheckboxCheckedState) => void
}

export function Checkbox({ children, onCheckedChange, ...rootProps }: CheckboxProps) {
  return (
    <ChakraCheckbox.Root
      {...rootProps}
      onCheckedChange={(details) => onCheckedChange?.(details.checked)}
    >
      <ChakraCheckbox.HiddenInput />
      <ChakraCheckbox.Control>
        <ChakraCheckbox.Indicator />
      </ChakraCheckbox.Control>
      {children != null ? <ChakraCheckbox.Label>{children}</ChakraCheckbox.Label> : null}
    </ChakraCheckbox.Root>
  )
}
```

### RadioGroup

- **Path:** `libs/shared/ui/src/lib/radio-group/radio-group.tsx`
- **Description:** Props-driven radio group, vertical by default.
- **Key props:** `items: { value, label, disabled? }[]`, `label?`, `value`, `defaultValue`, `onValueChange?(value | null)`, `orientation`.

`libs/shared/ui/src/lib/radio-group/radio-group.tsx` (50 lines)

```tsx
import type { ReactNode } from "react"

import { RadioGroup as ChakraRadioGroup, Stack } from "@chakra-ui/react"

export interface RadioGroupOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps extends Omit<
  ChakraRadioGroup.RootProps,
  "children" | "onValueChange"
> {
  items: RadioGroupOption[]
  label?: ReactNode
  /** `null` when the selection is cleared. */
  onValueChange?: (value: string | null) => void
}

export function RadioGroup({
  items,
  label,
  onValueChange,
  orientation = "vertical",
  ...rootProps
}: RadioGroupProps) {
  return (
    <ChakraRadioGroup.Root
      {...rootProps}
      orientation={orientation}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      {label ? <ChakraRadioGroup.Label>{label}</ChakraRadioGroup.Label> : null}
      <Stack
        direction={orientation === "horizontal" ? "row" : "column"}
        gap="3"
        mt={label ? "2" : undefined}
      >
        {items.map((item) => (
          <ChakraRadioGroup.Item key={item.value} value={item.value} disabled={item.disabled}>
            <ChakraRadioGroup.ItemHiddenInput />
            <ChakraRadioGroup.ItemIndicator />
            <ChakraRadioGroup.ItemText>{item.label}</ChakraRadioGroup.ItemText>
          </ChakraRadioGroup.Item>
        ))}
      </Stack>
    </ChakraRadioGroup.Root>
  )
}
```

### Switch

- **Path:** `libs/shared/ui/src/lib/switch/switch.tsx`
- **Description:** Chakra `Switch` with label as children.
- **Key props:** `children?`, `checked`, `defaultChecked`, `onCheckedChange?(checked)`, `disabled`.

`libs/shared/ui/src/lib/switch/switch.tsx` (24 lines)

```tsx
import type { ReactNode } from "react"

import { Switch as ChakraSwitch } from "@chakra-ui/react"

export interface SwitchProps extends Omit<ChakraSwitch.RootProps, "onCheckedChange"> {
  /** The switch's label. */
  children?: ReactNode
  onCheckedChange?: (checked: boolean) => void
}

export function Switch({ children, onCheckedChange, ...rootProps }: SwitchProps) {
  return (
    <ChakraSwitch.Root
      {...rootProps}
      onCheckedChange={(details) => onCheckedChange?.(details.checked)}
    >
      <ChakraSwitch.HiddenInput />
      <ChakraSwitch.Control>
        <ChakraSwitch.Thumb />
      </ChakraSwitch.Control>
      {children != null ? <ChakraSwitch.Label>{children}</ChakraSwitch.Label> : null}
    </ChakraSwitch.Root>
  )
}
```

### NativeSelect

- **Path:** `libs/shared/ui/src/lib/native-select/native-select.tsx`
- **Description:** Platform `<select>` styled by Chakra.
- **Key props:** `items: (string | { value, label, disabled? })[]`, `size`, `variant`, `disabled`, `invalid`, plus native field props.

`libs/shared/ui/src/lib/native-select/native-select.tsx` (42 lines)

```tsx
import { NativeSelect as ChakraNativeSelect } from "@chakra-ui/react"

export interface NativeSelectOption {
  value: string
  label: string
  disabled?: boolean
}

/** Renders a platform `<select>`. For a visible label, place it inside `Field.Root` with a `Field.Label`. */
export interface NativeSelectProps extends Omit<ChakraNativeSelect.FieldProps, "children"> {
  /** Plain strings are used as both value and label. */
  items: Array<string | NativeSelectOption>
  size?: ChakraNativeSelect.RootProps["size"]
  variant?: ChakraNativeSelect.RootProps["variant"]
  disabled?: boolean
  invalid?: boolean
}

export function NativeSelect({
  items,
  size,
  variant,
  disabled,
  invalid,
  ...fieldProps
}: NativeSelectProps) {
  return (
    <ChakraNativeSelect.Root size={size} variant={variant} disabled={disabled} invalid={invalid}>
      <ChakraNativeSelect.Field {...fieldProps}>
        {items.map((item) => {
          const option = typeof item === "string" ? { value: item, label: item } : item
          return (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          )
        })}
      </ChakraNativeSelect.Field>
      <ChakraNativeSelect.Indicator />
    </ChakraNativeSelect.Root>
  )
}
```

### Select

- **Path:** `libs/shared/ui/src/lib/select/select.tsx`
- **Description:** Custom Chakra `Select` (listbox in a portal, same width as trigger).
- **Key props:** `items: { value, label, disabled? }[]`, `label?`, `placeholder?`, `value`, `multiple`, `onValueChange?(string[])`.

`libs/shared/ui/src/lib/select/select.tsx` (62 lines)

```tsx
import { createListCollection, Portal, Select as ChakraSelect } from "@chakra-ui/react"
import { type ReactNode, useMemo } from "react"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<
  ChakraSelect.RootProps<SelectOption>,
  "collection" | "children" | "onValueChange"
> {
  items: SelectOption[]
  label?: ReactNode
  placeholder?: string
  /** Selected values; holds at most one entry unless `multiple` is set. */
  onValueChange?: (value: string[]) => void
}

export function Select({
  items,
  label,
  placeholder,
  onValueChange,
  positioning,
  ...rootProps
}: SelectProps) {
  const collection = useMemo(() => createListCollection({ items }), [items])

  return (
    <ChakraSelect.Root
      {...rootProps}
      collection={collection}
      positioning={{ sameWidth: true, ...positioning }}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      <ChakraSelect.HiddenSelect />
      {label ? <ChakraSelect.Label>{label}</ChakraSelect.Label> : null}
      <ChakraSelect.Control>
        <ChakraSelect.Trigger>
          <ChakraSelect.ValueText placeholder={placeholder} />
        </ChakraSelect.Trigger>
        <ChakraSelect.IndicatorGroup>
          <ChakraSelect.Indicator />
        </ChakraSelect.IndicatorGroup>
      </ChakraSelect.Control>
      <Portal>
        <ChakraSelect.Positioner>
          <ChakraSelect.Content>
            {collection.items.map((item) => (
              <ChakraSelect.Item key={item.value} item={item}>
                {item.label}
                <ChakraSelect.ItemIndicator />
              </ChakraSelect.Item>
            ))}
          </ChakraSelect.Content>
        </ChakraSelect.Positioner>
      </Portal>
    </ChakraSelect.Root>
  )
}
```

### NumberInput

- **Path:** `libs/shared/ui/src/lib/number-input/number-input.tsx`
- **Description:** Chakra `NumberInput` with stepper triggers.
- **Key props:** `label?`, `placeholder?`, `value`, `min`, `max`, `step`, `onValueChange?(valueAsNumber, value)`.

`libs/shared/ui/src/lib/number-input/number-input.tsx` (29 lines)

```tsx
import type { ReactNode } from "react"

import { NumberInput as ChakraNumberInput } from "@chakra-ui/react"

export interface NumberInputProps extends Omit<
  ChakraNumberInput.RootProps,
  "children" | "onValueChange"
> {
  label?: ReactNode
  placeholder?: string
  /** `valueAsNumber` is `NaN` while the input is empty. */
  onValueChange?: (valueAsNumber: number, value: string) => void
}

export function NumberInput({ label, placeholder, onValueChange, ...rootProps }: NumberInputProps) {
  return (
    <ChakraNumberInput.Root
      {...rootProps}
      onValueChange={(details) => onValueChange?.(details.valueAsNumber, details.value)}
    >
      {label ? <ChakraNumberInput.Label>{label}</ChakraNumberInput.Label> : null}
      <ChakraNumberInput.Control>
        <ChakraNumberInput.IncrementTrigger />
        <ChakraNumberInput.DecrementTrigger />
      </ChakraNumberInput.Control>
      <ChakraNumberInput.Input placeholder={placeholder} />
    </ChakraNumberInput.Root>
  )
}
```

---

## Navigation and disclosure

### Tabs

- **Path:** `libs/shared/ui/src/lib/tabs/tabs.tsx`
- **Description:** Props-driven tabs; opens on the first enabled tab by default.
- **Key props:** `items: { value, label, content, disabled? }[]`, `value`, `defaultValue`, `onValueChange?(value)`, `variant`.

`libs/shared/ui/src/lib/tabs/tabs.tsx` (44 lines)

```tsx
import type { ReactNode } from "react"

import { Tabs as ChakraTabs } from "@chakra-ui/react"

export interface TabsItemData {
  value: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps extends Omit<ChakraTabs.RootProps, "children" | "onValueChange"> {
  items: TabsItemData[]
  onValueChange?: (value: string) => void
}

/** Opens on the first tab unless `value` or `defaultValue` says otherwise. */
export function Tabs({ items, value, defaultValue, onValueChange, ...rootProps }: TabsProps) {
  return (
    <ChakraTabs.Root
      {...rootProps}
      value={value}
      defaultValue={
        value === undefined
          ? (defaultValue ?? items.find((item) => !item.disabled)?.value)
          : undefined
      }
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      <ChakraTabs.List>
        {items.map((item) => (
          <ChakraTabs.Trigger key={item.value} value={item.value} disabled={item.disabled}>
            {item.label}
          </ChakraTabs.Trigger>
        ))}
      </ChakraTabs.List>
      {items.map((item) => (
        <ChakraTabs.Content key={item.value} value={item.value}>
          {item.content}
        </ChakraTabs.Content>
      ))}
    </ChakraTabs.Root>
  )
}
```

### Accordion

- **Path:** `libs/shared/ui/src/lib/accordion/accordion.tsx`
- **Description:** Props-driven accordion; `collapsible` defaults to true.
- **Key props:** `items: { value, title, content, disabled? }[]`, `multiple`, `collapsible`, `onValueChange?(string[])`.

`libs/shared/ui/src/lib/accordion/accordion.tsx` (47 lines)

```tsx
import type { ReactNode } from "react"

import { Accordion as ChakraAccordion, Span } from "@chakra-ui/react"

export interface AccordionItemData {
  value: string
  title: ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface AccordionProps extends Omit<
  ChakraAccordion.RootProps,
  "children" | "onValueChange"
> {
  items: AccordionItemData[]
  /** Values of the open items. */
  onValueChange?: (value: string[]) => void
}

/** Unlike Chakra's default, an open item can be closed again (`collapsible` defaults to true). */
export function Accordion({
  items,
  onValueChange,
  collapsible = true,
  ...rootProps
}: AccordionProps) {
  return (
    <ChakraAccordion.Root
      {...rootProps}
      collapsible={collapsible}
      onValueChange={(details) => onValueChange?.(details.value)}
    >
      {items.map((item) => (
        <ChakraAccordion.Item key={item.value} value={item.value} disabled={item.disabled}>
          <ChakraAccordion.ItemTrigger>
            <Span flex="1">{item.title}</Span>
            <ChakraAccordion.ItemIndicator />
          </ChakraAccordion.ItemTrigger>
          <ChakraAccordion.ItemContent>
            <ChakraAccordion.ItemBody>{item.content}</ChakraAccordion.ItemBody>
          </ChakraAccordion.ItemContent>
        </ChakraAccordion.Item>
      ))}
    </ChakraAccordion.Root>
  )
}
```

### Breadcrumb

- **Path:** `libs/shared/ui/src/lib/breadcrumb/breadcrumb.tsx`
- **Description:** Breadcrumb trail; last item renders as the current page.
- **Key props:** `items: { label, href? }[]`, `separator?`.

`libs/shared/ui/src/lib/breadcrumb/breadcrumb.tsx` (42 lines)

```tsx
import { Breadcrumb as ChakraBreadcrumb } from "@chakra-ui/react"
import { Fragment, type ReactNode } from "react"

export interface BreadcrumbItemData {
  label: ReactNode
  /** Ignored on the last item, which renders as the current page. */
  href?: string
}

export interface BreadcrumbProps extends Omit<ChakraBreadcrumb.RootProps, "children"> {
  items: BreadcrumbItemData[]
  /** Replaces the default chevron. */
  separator?: ReactNode
}

export function Breadcrumb({ items, separator, ...rootProps }: BreadcrumbProps) {
  return (
    <ChakraBreadcrumb.Root {...rootProps}>
      <ChakraBreadcrumb.List>
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <Fragment key={index}>
              <ChakraBreadcrumb.Item>
                {last ? (
                  <ChakraBreadcrumb.CurrentLink>{item.label}</ChakraBreadcrumb.CurrentLink>
                ) : (
                  <ChakraBreadcrumb.Link href={item.href}>{item.label}</ChakraBreadcrumb.Link>
                )}
              </ChakraBreadcrumb.Item>
              {last ? null : separator ? (
                <ChakraBreadcrumb.Separator>{separator}</ChakraBreadcrumb.Separator>
              ) : (
                <ChakraBreadcrumb.Separator />
              )}
            </Fragment>
          )
        })}
      </ChakraBreadcrumb.List>
    </ChakraBreadcrumb.Root>
  )
}
```

### Pagination

- **Path:** `libs/shared/ui/src/lib/pagination/pagination.tsx`
- **Description:** Prev / numbered pages / next, as ghost icon buttons (selected page is outline).
- **Key props:** `count` (records), `pageSize` (default 10), `page`, `defaultPage`, `onPageChange?(page)`, `buttonSize` (default `sm`).

`libs/shared/ui/src/lib/pagination/pagination.tsx` (42 lines)

```tsx
import { HStack, Icon, IconButton, Pagination as ChakraPagination } from "@chakra-ui/react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PaginationProps extends Omit<
  ChakraPagination.RootProps,
  "children" | "onPageChange" | "type"
> {
  /** Size of the page buttons. */
  buttonSize?: "xs" | "sm" | "md" | "lg"
  onPageChange?: (page: number) => void
}

/** `count` is the total number of records; the page count is derived from `pageSize` (default 10). */
export function Pagination({ buttonSize = "sm", onPageChange, ...rootProps }: PaginationProps) {
  return (
    <ChakraPagination.Root {...rootProps} onPageChange={(details) => onPageChange?.(details.page)}>
      <HStack gap="1">
        <ChakraPagination.PrevTrigger asChild>
          <IconButton variant="ghost" size={buttonSize}>
            <Icon asChild>
              <ChevronLeft />
            </Icon>
          </IconButton>
        </ChakraPagination.PrevTrigger>
        <ChakraPagination.Items
          render={(page) => (
            <IconButton size={buttonSize} variant={{ base: "ghost", _selected: "outline" }}>
              {page.value}
            </IconButton>
          )}
        />
        <ChakraPagination.NextTrigger asChild>
          <IconButton variant="ghost" size={buttonSize}>
            <Icon asChild>
              <ChevronRight />
            </Icon>
          </IconButton>
        </ChakraPagination.NextTrigger>
      </HStack>
    </ChakraPagination.Root>
  )
}
```

---

## Primitives (Chakra re-exports, unchanged)

These files only re-export Chakra components. Use them with Chakra style props and recipes exactly as documented by Chakra v3.

### Layout: `Box`, `Center`, `chakra`, `Container`, `Flex`, `Grid`, `GridItem`, `HStack`, `Separator`, `SimpleGrid`, `Stack`, `VStack`

`libs/shared/ui/src/lib/primitives/layout.ts` (26 lines)

```ts
export {
  Box,
  Center,
  chakra,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Separator,
  SimpleGrid,
  Stack,
  VStack
} from "@chakra-ui/react"
export type {
  BoxProps,
  CenterProps,
  ContainerProps,
  FlexProps,
  GridItemProps,
  GridProps,
  HTMLChakraProps,
  SeparatorProps,
  SimpleGridProps,
  StackProps
} from "@chakra-ui/react"
```

### Typography: `Code`, `Heading`, `Link`, `Text`

`libs/shared/ui/src/lib/primitives/typography.ts` (2 lines)

```ts
export { Code, Heading, Link, Text } from "@chakra-ui/react"
export type { CodeProps, HeadingProps, LinkProps, TextProps } from "@chakra-ui/react"
```

### Buttons: `ButtonGroup`, `CloseButton`, `IconButton`

`libs/shared/ui/src/lib/primitives/buttons.ts` (3 lines)

```ts
// `Button` is exported from `../button/button`, not re-exported here.
export { ButtonGroup, CloseButton, IconButton } from "@chakra-ui/react"
export type { ButtonGroupProps, CloseButtonProps, IconButtonProps } from "@chakra-ui/react"
```

### Forms: `Field`, `FileUpload`, `Input`, `Textarea`

`libs/shared/ui/src/lib/primitives/forms.ts` (2 lines)

```ts
export { Field, FileUpload, Input, Textarea } from "@chakra-ui/react"
export type { InputProps, TextareaProps } from "@chakra-ui/react"
```

### Feedback: `Skeleton`, `SkeletonCircle`, `SkeletonText`, `Spinner`

`libs/shared/ui/src/lib/primitives/feedback.ts` (7 lines)

```ts
export { Skeleton, SkeletonCircle, SkeletonText, Spinner } from "@chakra-ui/react"
export type {
  SkeletonCircleProps,
  SkeletonProps,
  SkeletonTextProps,
  SpinnerProps
} from "@chakra-ui/react"
```

### Data display: `AvatarGroup`, `Badge`, `Card`, `List`, `StatGroup`, `Table`

`libs/shared/ui/src/lib/primitives/data-display.ts` (4 lines)

```ts
// Card, List and Table stay as Chakra's slot namespaces (`Card.Root`, `Table.Row`, ...):
// their parts compose freely and a props-driven wrapper would only narrow them.
export { AvatarGroup, Badge, Card, List, StatGroup, Table } from "@chakra-ui/react"
export type { AvatarGroupProps, BadgeProps, StatGroupProps } from "@chakra-ui/react"
```

---

## Web chrome: `@h2-fe/web-ui`

### ViewerTopBar

- **Path:** `libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx`
- **Description:** Floating top bar over the canvas (absolute, full width, `zIndex 400`, click-through except its panels). Left: a `bg.panel` card with truncated filename and pager (Previous, page-number input, "of N", Next). Right: `ColorModeButton` + outline "Open another document".
- **Key props:** `filename?`, `page`, `totalPages` (pager hidden when 0), `onPageChange(page)`, `onOpenAnother()`.

`libs/web/ui/src/index.ts` (1 lines)

```ts
export * from "./lib/viewer-top-bar/viewer-top-bar"
```

`libs/web/ui/src/lib/viewer-top-bar/viewer-top-bar.tsx` (130 lines)

```tsx
import { useRef } from "react"

import { Button, ColorModeButton, Field, Flex, Input, Text } from "@h2-fe/ui"

interface ViewerTopBarProps {
  filename?: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onOpenAnother: () => void
}

export function ViewerTopBar({
  filename,
  page,
  totalPages,
  onPageChange,
  onOpenAnother
}: ViewerTopBarProps) {
  const pageInput = useRef<HTMLInputElement>(null)
  const jump = () => {
    const requested = Number(pageInput.current?.value)
    if (Number.isInteger(requested) && requested >= 1 && requested <= totalPages) {
      if (requested !== page) onPageChange(requested)
    } else if (pageInput.current) {
      pageInput.current.value = String(page)
    }
  }

  // Blur abandons a half-typed jump instead of performing it: clicking Next
  // blurs this field first, so committing on blur would navigate to the typed
  // page instead of the button's target.
  const abandonJump = () => {
    if (pageInput.current) pageInput.current.value = String(page)
  }

  return (
    <Flex
      align="start"
      gap="2"
      flexWrap="wrap"
      left="0"
      p="4"
      pointerEvents="none"
      position="absolute"
      right="0"
      top="0"
      zIndex={400}
    >
      <Flex
        align="center"
        bg="bg.panel"
        borderRadius="md"
        boxShadow="md"
        color="fg"
        flexWrap="wrap"
        gap="2"
        maxW="full"
        p="2"
        pointerEvents="auto"
      >
        <Text
          fontSize="sm"
          maxW="36"
          overflow="hidden"
          textOverflow="ellipsis"
          title={filename}
          whiteSpace="nowrap"
        >
          {filename ?? "Document"}
        </Text>
        {totalPages > 0 && (
          <Flex align="center" gap="1">
            <Button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                jump()
              }}
            >
              <Field.Root>
                <Field.Label srOnly>Page number</Field.Label>
                <Input
                  aria-label="Page number"
                  defaultValue={page}
                  inputMode="numeric"
                  key={page}
                  max={totalPages}
                  min={1}
                  onBlur={abandonJump}
                  ref={pageInput}
                  size="sm"
                  textAlign="center"
                  type="number"
                  w="14"
                />
              </Field.Root>
            </form>
            <Text fontSize="sm" whiteSpace="nowrap">
              of {totalPages}
            </Text>
            <Button
              aria-label="Next page"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        )}
      </Flex>
      <Flex flexShrink="0" gap="2" marginLeft="auto" pointerEvents="auto" whiteSpace="nowrap">
        <ColorModeButton />
        <Button onClick={onOpenAnother} variant="outline">
          Open another document
        </Button>
      </Flex>
    </Flex>
  )
}
```

---

## Appendix: on-canvas UI in feature libs

These render inside tldraw (via the `InFrontOfTheCanvas` slot or as shape components). They use `@h2-fe/ui` primitives plus tldraw UI parts. They are not in the design system, but they are visible UI.

### CropFrameToolbar (camera)

- **Path:** `libs/web/features/camera/src/lib/crop-frame-toolbar/crop-frame-toolbar.tsx`
- **Description:** tldraw contextual toolbar above a selected crop frame: three 44px icon buttons (Download PNG, Copy image, Download SVG) with spinner/check states and a "Nothing inside" hint when the frame is empty. Brand focus ring overrides tldraw's.
- **Key props:** `documentName?` (used for export file names).

`libs/web/features/camera/src/lib/crop-frame-toolbar/crop-frame-toolbar.tsx` (170 lines)

```tsx
import { Check, ClipboardCopy, ImageDown, VectorSquare } from "lucide-react"
import { useCallback, useId, type ReactElement } from "react"
import {
  TldrawUiButtonIcon,
  TldrawUiContextualToolbar,
  TldrawUiToolbarButton,
  useEditor,
  useValue,
  type TLShapeId
} from "tldraw"

import { Box, Spinner, Text } from "@h2-fe/ui"

import type { CropAction } from "../types"

import {
  CROP_ACTION_LABELS,
  CROP_FRAME_TOOLBAR_CLASS,
  CROP_FRAME_TOOLBAR_DESCRIPTION,
  CROP_FRAME_TOOLBAR_LABEL,
  EMPTY_FRAME_HINT
} from "../consts"
import {
  useCropActions,
  useCropFrameToolbarTarget,
  useCropToolbarAnchor,
  useIsCropFrameEmpty
} from "./hooks"

const ICON_SIZE = 18
const ICON_STROKE = 1.75

const ACTIONS: readonly { action: CropAction; icon: ReactElement }[] = [
  { action: "download-png", icon: <ImageDown size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "copy-png", icon: <ClipboardCopy size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { action: "download-svg", icon: <VectorSquare size={ICON_SIZE} strokeWidth={ICON_STROKE} /> }
]

/** `TldrawUiContextualToolbar` doesn't forward `aria-describedby`; set it on its toolbar. */
function describeToolbar(description: HTMLElement | null): (() => void) | undefined {
  const toolbar = description?.closest('[role="toolbar"]')
  if (!description || !toolbar) return undefined
  toolbar.setAttribute("aria-describedby", description.id)
  return () => toolbar.removeAttribute("aria-describedby")
}

const DONE_ICON = <Check size={ICON_SIZE} strokeWidth={ICON_STROKE} />

// tldraw.css is unlayered, so it beats Chakra's layered recipes; repeating the
// class outranks `.tlui-button` (0,1,0) and tldraw's focus ring (0,4,0).
const actionButtonCss = {
  "&&&": { minWidth: "44px", height: "44px", paddingInline: "0" },
  "&&&&&:focus-visible": {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.focusRing",
    outlineOffset: "-4px",
    borderRadius: "lg"
  }
}

interface CropActionButtonProps {
  action: CropAction
  label: string
  icon: ReactElement
  isInert: boolean
  isBusy: boolean
  isDone: boolean
  describedBy: string | undefined
  onRun: (action: CropAction) => void
}

function CropActionButton({
  action,
  label,
  icon,
  isInert,
  isBusy,
  isDone,
  describedBy,
  onRun
}: CropActionButtonProps) {
  const handleClick = useCallback(() => {
    if (!isInert) onRun(action)
  }, [action, isInert, onRun])

  // Disabled stays focusable (aria-disabled, not disabled), so keyboard users
  // can still find the actions and hear why they're unavailable.
  return (
    <Box asChild colorPalette="brand" css={actionButtonCss}>
      <TldrawUiToolbarButton
        type="icon"
        title={label}
        aria-disabled={isInert || undefined}
        data-disabled={isInert ? "" : undefined}
        aria-busy={isBusy || undefined}
        aria-describedby={describedBy}
        onClick={handleClick}
      >
        {isBusy ? (
          <Spinner size="sm" color="brand.fg" />
        ) : (
          <TldrawUiButtonIcon icon={isDone ? DONE_ICON : icon} />
        )}
      </TldrawUiToolbarButton>
    </Box>
  )
}

interface CropFrameToolbarContentProps {
  frameId: TLShapeId
  documentName?: string
}

function CropFrameToolbarContent({ frameId, documentName }: CropFrameToolbarContentProps) {
  const editor = useEditor()
  const colorMode = useValue("crop toolbar colour mode", () => editor.getColorMode(), [editor])
  const isEmpty = useIsCropFrameEmpty(editor, frameId)
  const { busyAction, doneAction, isBusy, run } = useCropActions(editor, frameId, documentName)
  const hintId = useId()
  const descriptionId = useId()
  const getSelectionBounds = useCropToolbarAnchor(editor, frameId)
  const isInert = isEmpty || isBusy

  return (
    <TldrawUiContextualToolbar
      className={`${CROP_FRAME_TOOLBAR_CLASS} ${colorMode}`}
      getSelectionBounds={getSelectionBounds}
      label={CROP_FRAME_TOOLBAR_LABEL}
    >
      <Text id={descriptionId} ref={describeToolbar} display="none">
        {CROP_FRAME_TOOLBAR_DESCRIPTION}
      </Text>
      {ACTIONS.map(({ action, icon }) => (
        <CropActionButton
          key={action}
          action={action}
          label={CROP_ACTION_LABELS[action]}
          icon={icon}
          isInert={isInert}
          isBusy={busyAction === action}
          isDone={doneAction === action}
          describedBy={isEmpty ? hintId : undefined}
          onRun={run}
        />
      ))}
      {isEmpty && (
        <Text
          id={hintId}
          alignSelf="center"
          textStyle="xs"
          color="fg.muted"
          ps="1"
          pe="3"
          whiteSpace="nowrap"
        >
          {EMPTY_FRAME_HINT}
        </Text>
      )}
    </TldrawUiContextualToolbar>
  )
}

/** Export actions beside the selected crop frame (the `InFrontOfTheCanvas` slot). */
export function CropFrameToolbar({ documentName }: { documentName?: string }) {
  const editor = useEditor()
  const frameId = useCropFrameToolbarTarget(editor)
  if (!frameId) return null
  return <CropFrameToolbarContent key={frameId} frameId={frameId} documentName={documentName} />
}
```

### CropFrameOutline (camera)

- **Path:** `libs/web/features/camera/src/lib/crop-frame/crop-frame-outline.tsx`
- **Description:** Look of a crop frame and its drag marquee: dashed `brand.fg` border over a `bg` halo, L-shaped corner marks, and a size label pill (`brand.solid` / `brand.contrast`, or `fg` / `bg` when selected) below the frame.
- **Key props:** `w`, `h`, `unit` (1/zoom), `label`, `selected?`, `revealLabel?`, `colorMode?`.

`libs/web/features/camera/src/lib/crop-frame/crop-frame-outline.tsx` (125 lines)

```tsx
import { useLayoutEffect, useRef, useState } from "react"

import { Box, Text } from "@h2-fe/ui"

import { CROP_FRAME_LABEL_ATTR, FRAME_CORNER_PX } from "../consts"

/** Path for the four L-shaped corner marks of a `w`×`h` box. */
function cornerMarksPath(w: number, h: number, length: number): string {
  return [
    `M0,${length} V0 H${length}`,
    `M${w - length},0 H${w} V${length}`,
    `M${w},${h - length} V${h} H${w - length}`,
    `M${length},${h} H0 V${h - length}`
  ].join(" ")
}

interface CropFrameOutlineProps {
  w: number
  h: number
  /**
   * How many of the outline's own units make one screen pixel: `1 / zoom`
   * inside a shape (page space), 1 in screen space. The chrome stays the same
   * size on screen either way.
   */
  unit: number
  label: string
  /** tldraw's selection handles take the corners, and its blue box would clash with a brand label. */
  selected?: boolean
  /** Show the label even when the frame is narrower than it. */
  revealLabel?: boolean
  /** tldraw color mode: dark corners use `brand.fg` for contrast. */
  colorMode?: "light" | "dark"
}

/**
 * The look shared by a crop frame and the marquee that draws one: dashed
 * border, corner marks, and the size label below.
 */
export function CropFrameOutline({
  w,
  h,
  unit,
  label,
  selected = false,
  revealLabel = false,
  colorMode = "light"
}: CropFrameOutlineProps) {
  const px = (screenPx: number) => screenPx * unit
  const corners = cornerMarksPath(w, h, Math.min(px(FRAME_CORNER_PX), w / 3, h / 3))
  const labelRef = useRef<HTMLParagraphElement>(null)
  const [labelWidth, setLabelWidth] = useState(0)
  useLayoutEffect(() => {
    const element = labelRef.current
    if (!element) return undefined
    // offsetWidth ignores transforms, so this is the label's width on screen.
    const observer = new ResizeObserver(() => setLabelWidth(element.offsetWidth))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const isLabelShown = revealLabel || selected || w / unit >= labelWidth

  return (
    <>
      <svg width={w} height={h} overflow="visible" aria-hidden="true">
        <Box asChild stroke="bg" strokeWidth={px(3)} fill="none">
          <rect width={w} height={h} />
        </Box>
        <Box
          asChild
          stroke="brand.fg"
          strokeWidth={px(1.5)}
          strokeDasharray={`${px(6)} ${px(4)}`}
          fill="none"
        >
          <rect width={w} height={h} />
        </Box>
        <Box asChild visibility={selected ? "hidden" : undefined}>
          <g data-crop-corners="" data-corner-token={colorMode === "dark" ? "fg" : "solid"}>
            <Box asChild stroke="bg" strokeWidth={px(6)} strokeLinecap="square" fill="none">
              <path d={corners} />
            </Box>
            <Box
              asChild
              stroke={colorMode === "dark" ? "brand.fg" : "brand.solid"}
              strokeWidth={px(3)}
              strokeLinecap="square"
              fill="none"
            >
              <path d={corners} />
            </Box>
          </g>
        </Box>
      </svg>
      {/* Below the frame: the contextual toolbar takes the space above it. */}
      <Box
        position="absolute"
        left="0"
        top="100%"
        pt="2"
        transformOrigin="top left"
        transform={`scale(${unit})`}
        visibility={isLabelShown ? undefined : "hidden"}
        aria-hidden="true"
        {...{ [CROP_FRAME_LABEL_ATTR]: "" }}
      >
        <Text
          ref={labelRef}
          as="span"
          display="block"
          width="max-content"
          textStyle="xs"
          fontWeight="medium"
          fontVariantNumeric="tabular-nums"
          whiteSpace="nowrap"
          bg={selected ? "fg" : "brand.solid"}
          color={selected ? "bg" : "brand.contrast"}
          px="1.5"
          rounded="sm"
        >
          {label}
        </Text>
      </Box>
    </>
  )
}
```

### FirstUseHint (camera)

- **Path:** `libs/web/features/camera/src/lib/first-use-hint/first-use-hint.tsx`
- **Description:** Pill at top-centre of the canvas (`bg.panel`, `shadow md`, `rounded full`, `textStyle sm`), shown once per session when the camera tool is first used. Copy: "Drag to frame an area to export · Esc to cancel".
- **Key props:** none (reads tldraw state).

`libs/web/features/camera/src/lib/first-use-hint/first-use-hint.tsx` (57 lines)

```tsx
import { useEditor, useValue } from "tldraw"

import { Box, Text } from "@h2-fe/ui"

import type { CameraTool } from "../camera-tool"

import { CAMERA_TOOL_ID, FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY } from "../consts"

/** Whether to show the hint on this tool entry: once per browser session. */
export function claimFirstUseHint(): boolean {
  try {
    if (sessionStorage.getItem(FIRST_USE_HINT_STORAGE_KEY)) return false
    sessionStorage.setItem(FIRST_USE_HINT_STORAGE_KEY, "1")
  } catch {
    // Storage blocked (privacy mode, sandboxed frame): show it every time.
  }
  return true
}

/** The one-line how-to shown on the tool's first use (`InFrontOfTheCanvas`). */
export function FirstUseHint() {
  const editor = useEditor()
  const colorMode = useValue("camera hint colour mode", () => editor.getColorMode(), [editor])
  const isShown = useValue(
    "camera first-use hint",
    () => editor.getStateDescendant<CameraTool>(CAMERA_TOOL_ID)?.hint.get() ?? false,
    [editor]
  )

  // The live region stays mounted so the hint is announced when it appears.
  return (
    <Box
      as="output"
      className={colorMode}
      position="absolute"
      top="3"
      left="50%"
      transform="translateX(-50%)"
      pointerEvents="none"
    >
      {isShown && (
        <Text
          textStyle="sm"
          whiteSpace="nowrap"
          bg="bg.panel"
          color="fg"
          px="3"
          py="1.5"
          rounded="full"
          shadow="md"
        >
          {FIRST_USE_HINT}
        </Text>
      )}
    </Box>
  )
}
```

### FirstUseHint (pin)

- **Path:** `libs/web/features/pin/src/lib/first-use-hint.tsx`
- **Description:** Same pill as the camera hint, for the pin tool. Copy: "Click or drag to pin · Esc to cancel".
- **Key props:** none.

`libs/web/features/pin/src/lib/first-use-hint.tsx` (56 lines)

```tsx
import { useEditor, useValue } from "tldraw"

import { Box, Text } from "@h2-fe/ui"

import type { PinTool } from "./pin-tool"

import { FIRST_USE_HINT, FIRST_USE_HINT_STORAGE_KEY, PIN_TOOL_ID } from "./consts"

/** Whether to show the hint on this tool entry: once per browser session. */
export function claimFirstUseHint(): boolean {
  try {
    if (sessionStorage.getItem(FIRST_USE_HINT_STORAGE_KEY)) return false
    sessionStorage.setItem(FIRST_USE_HINT_STORAGE_KEY, "1")
  } catch {
    // Storage blocked (privacy mode, sandboxed frame): show it every time.
  }
  return true
}

/** The one-line how-to shown on the tool's first use (`InFrontOfTheCanvas`). */
export function FirstUseHint() {
  const editor = useEditor()
  const colorMode = useValue("pin hint colour mode", () => editor.getColorMode(), [editor])
  const isShown = useValue(
    "pin first-use hint",
    () => editor.getStateDescendant<PinTool>(PIN_TOOL_ID)?.hint.get() ?? false,
    [editor]
  )

  return (
    <Box
      as="output"
      className={colorMode}
      position="absolute"
      top="3"
      left="50%"
      transform="translateX(-50%)"
      pointerEvents="none"
    >
      {isShown && (
        <Text
          textStyle="sm"
          whiteSpace="nowrap"
          bg="bg.panel"
          color="fg"
          px="3"
          py="1.5"
          rounded="full"
          shadow="md"
        >
          {FIRST_USE_HINT}
        </Text>
      )}
    </Box>
  )
}
```

### PinView, PinGlyph, PinIcon (pin)

- **Paths:** `libs/web/features/pin/src/lib/partials/pin-view.tsx`, `pin-glyph.tsx`, `pin-icon.tsx`
- **Description:** `PinView` is the pushpin shape on canvas (24×36 page units): SVG glyph, a count badge, and a ping ring when it attaches (static halo under reduced motion). `PinGlyph` is the raw SVG pushpin with inline colours (also used for SVG export). `PinIcon` is the 18px lucide `Pin` used as the toolbar icon.
- **Key props:** `PinView`: `id`, `state` (`free` | `holding`), `colors`, `badge`, `attaching`, `scale`. `PinGlyph`: `colors`. `PinIcon`: `className`, `style`, `aria-label`.

`libs/web/features/pin/src/lib/partials/pin-view.tsx` (120 lines)

```tsx
import type { TLShapeId } from "tldraw"

import { HTMLContainer } from "tldraw"

import type { BoxProps } from "@h2-fe/ui"
import { Box } from "@h2-fe/ui"

import type { PinColors, PinState } from "../types"

import { ATTACH_FLASH_MS, PIN_HEAD, PIN_SIZE, PIN_TIP } from "../consts"
import { PinGlyph } from "./pin-glyph"

interface PinViewProps {
  id: TLShapeId
  state: PinState
  colors: PinColors
  badge: string | null
  attaching: boolean
  /** Glyph and ring scale about the tip; see `glyphScale`. */
  scale: number
}

const HALO_GAP = 3
const HIDDEN = { display: "none" } as const

/** A ring centred on the pin head. */
function HeadRing({ radius, ...rest }: BoxProps & { radius: number }) {
  return (
    <Box
      position="absolute"
      left={`${PIN_HEAD.cx - radius}px`}
      top={`${PIN_HEAD.cy - radius}px`}
      boxSize={`${radius * 2}px`}
      rounded="full"
      borderWidth="2px"
      pointerEvents="none"
      {...rest}
    />
  )
}

/**
 * The pin on the canvas, in page units: glyph, count badge and, right after
 * it attaches, a ring that pings out from the head (a static halo just clear
 * of the head when the user prefers reduced motion).
 */
export function PinView({ id, state, colors, badge, attaching, scale }: PinViewProps) {
  return (
    <Box
      asChild
      data-pin-id={id}
      data-state={state}
      data-attaching={attaching || undefined}
      w={`${PIN_SIZE.w}px`}
      h={`${PIN_SIZE.h}px`}
      overflow="visible"
    >
      <HTMLContainer>
        <Box
          position="absolute"
          inset="0"
          transform={scale === 1 ? undefined : `scale(${scale})`}
          transformOrigin={`${PIN_TIP.x}px ${PIN_TIP.y}px`}
        >
          {attaching && (
            <>
              <HeadRing
                data-ring="ping"
                radius={PIN_HEAD.r}
                borderColor={colors.stroke}
                animationName="ping"
                animationDuration={`${ATTACH_FLASH_MS}ms`}
                animationTimingFunction="cubic-bezier(0, 0, 0.2, 1)"
                animationFillMode="forwards"
                _motionReduce={HIDDEN}
              />
              <HeadRing
                data-ring="halo"
                radius={PIN_HEAD.r + HALO_GAP}
                borderColor={colors.stroke}
                opacity={0.5}
                _motionSafe={HIDDEN}
              />
            </>
          )}
          <svg
            width={PIN_SIZE.w}
            height={PIN_SIZE.h}
            viewBox={`0 0 ${PIN_SIZE.w} ${PIN_SIZE.h}`}
            overflow="visible"
            aria-hidden
          >
            <PinGlyph colors={colors} />
          </svg>
        </Box>
        {badge && (
          <Box
            position="absolute"
            top="-1.5"
            right="-2.5"
            minW="4"
            h="4"
            px="1"
            rounded="full"
            borderWidth="1px"
            borderColor={colors.stroke}
            bg={colors.badgeBg}
            color={colors.badgeFg}
            fontSize="2xs"
            fontWeight="semibold"
            lineHeight="0.875rem"
            textAlign="center"
          >
            {badge}
          </Box>
        )}
      </HTMLContainer>
    </Box>
  )
}
```

`libs/web/features/pin/src/lib/partials/pin-glyph.tsx` (46 lines)

```tsx
import type { PinColors } from "../types"

import { PIN_COLLAR_PATH, PIN_HEAD, PIN_NEEDLE } from "../consts"

/**
 * The pushpin itself, as plain SVG with inline colours: it is shared by the
 * canvas view and the SVG export, where no stylesheet applies.
 */
export function PinGlyph({ colors }: { colors: PinColors }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <line
        x1={PIN_NEEDLE.x}
        y1={PIN_NEEDLE.y1}
        x2={PIN_NEEDLE.x}
        y2={PIN_NEEDLE.y2}
        stroke={colors.needle}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={2}
      />
      <path
        d={PIN_COLLAR_PATH}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_HEAD.cx}
        cy={PIN_HEAD.cy}
        r={PIN_HEAD.r - 0.75}
        fill={colors.head}
        stroke={colors.stroke}
        strokeOpacity={colors.lineOpacity}
        strokeWidth={1.5}
      />
      <circle
        cx={PIN_HEAD.cx - 3}
        cy={PIN_HEAD.cy - 3}
        r={2.25}
        fill={colors.glint}
        fillOpacity={0.55}
      />
    </g>
  )
}
```

`libs/web/features/pin/src/lib/partials/pin-icon.tsx` (27 lines)

```tsx
import type { CSSProperties } from "react"

import { Pin } from "lucide-react"

import { Box } from "@h2-fe/ui"

interface PinIconProps {
  className?: string
  style?: CSSProperties
  "aria-label"?: string
}

/**
 * tldraw clones a JSX tool icon with `className`, `style` and `aria-label`
 * (`TldrawUiIcon`); `Box asChild` lands them, plus the size token, on the
 * lucide svg. 18px and stroke 1.5 match tldraw's own toolbar icons. Toolbar
 * buttons pass an empty label (the button carries the name), so the svg is
 * then decorative.
 */
export function PinIcon({ className, style, "aria-label": label }: PinIconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true }
  return (
    <Box asChild boxSize="4.5" flexShrink="0" className={className} style={style}>
      <Pin {...a11y} strokeWidth={1.5} />
    </Box>
  )
}
```
