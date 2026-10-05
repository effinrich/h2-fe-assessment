import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react"
import { useRef } from "react"

import { Button, chakra, ColorModeButton, Field, Flex, IconButton, Input, Text } from "@h2-fe/ui"

import { AppHeader } from "../app-header/app-header"

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
    <AppHeader
      start={
        <Text color="fg.muted" fontSize="sm" title={filename} truncate>
          {filename ?? "Document"}
        </Text>
      }
      end={
        <>
          <ColorModeButton />
          <Button
            aria-label="Open another document"
            onClick={onOpenAnother}
            size="sm"
            variant="outline"
          >
            <FolderOpen />
            <chakra.span hideBelow="md">Open another</chakra.span>
          </Button>
        </>
      }
    >
      {totalPages > 0 && (
        <Flex
          align="center"
          fontFamily="mono"
          fontSize="sm"
          fontVariantNumeric="tabular-nums"
          gap="1"
        >
          <IconButton
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft />
          </IconButton>
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
                css={{
                  MozAppearance: "textfield",
                  "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                    appearance: "none",
                    margin: 0
                  }
                }}
                defaultValue={page}
                fontFamily="inherit"
                inputMode="numeric"
                key={page}
                max={totalPages}
                min={1}
                onBlur={abandonJump}
                px="1"
                ref={pageInput}
                size="sm"
                textAlign="center"
                type="number"
                w="12"
              />
            </Field.Root>
          </form>
          <Text color="fg.muted" whiteSpace="nowrap">
            <chakra.span srOnly>of</chakra.span>
            <span aria-hidden>/</span> {totalPages}
          </Text>
          <IconButton
            aria-label="Next page"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            variant="ghost"
          >
            <ChevronRight />
          </IconButton>
        </Flex>
      )}
    </AppHeader>
  )
}
