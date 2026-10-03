import { Box, Button, Flex } from '@h2-fe/ui'

interface ViewerTopBarProps {
  onOpenAnother: () => void
}

// The viewer's only chrome: one exit back to the home route, sitting above the
// canvas. The overlay is pointer-events:none so the canvas stays fully
// interactive; only the button receives events.
export function ViewerTopBar({ onOpenAnother }: ViewerTopBarProps) {
  return (
    <Flex
      padding="4"
      pointerEvents="none"
      position="absolute"
      top="0"
      left="0"
      right="0"
      zIndex={1}
    >
      <Box marginLeft="auto" pointerEvents="auto">
        <Button onClick={onOpenAnother} variant="outline">
          Open another document
        </Button>
      </Box>
    </Flex>
  )
}
