import { Box, Button, Flex, Heading, Text } from "@h2-fe/ui"
import { useRef } from "react"

import type { HomeScreenProps } from "./types"

// The route's own composition: teach what the canvas is for and offer two ways
// in. The route provides callbacks; this screen holds only markup and the
// file input's ref.
export function HomeScreen({ onFileChange, onUseExample, isBusy = false }: HomeScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Flex align="center" justify="center" minH="100dvh" p="8">
      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="lg"
        color="fg"
        p="8"
        maxW="sm"
      >
        <Heading size="lg">Open a document</Heading>
        <Text marginTop="2">A PDF lands on the canvas, ready to mark up.</Text>

        <Button
          disabled={isBusy}
          marginTop="6"
          variant="solid"
          w="full"
          onClick={() => inputRef.current?.click()}
        >
          {isBusy ? "Opening" : "Open PDF"}
        </Button>
        <Button disabled={isBusy} marginTop="2" variant="outline" w="full" onClick={onUseExample}>
          Use an example
        </Button>
      </Box>

      <input accept="application/pdf" hidden onChange={onFileChange} ref={inputRef} type="file" />
    </Flex>
  )
}
