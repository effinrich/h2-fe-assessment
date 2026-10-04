import { Box, Button, Flex, Text } from "@h2-fe/ui"
import { useRef } from "react"

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
      <Box marginLeft="auto" pointerEvents="auto">
        <Button onClick={onOpenAnother} variant="outline">
          Open another document
        </Button>
      </Box>
    </Flex>
  )
}
