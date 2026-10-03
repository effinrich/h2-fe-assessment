import { useRef } from 'react'
import { Box, Button, Flex, Heading, Text } from '@h2-fe/ui'
import type { HomeScreenProps } from './types'

// The route's own composition: teach what the canvas is for and offer two ways
// in. Everything stateful is a callback the route wrapper provides — this file
// holds nothing but markup, the file input's own ref, and the busy flag.
export function HomeScreen({ onFileChosen, onUseExample, isBusy = false }: HomeScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFileChosen(file)
  }

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
        <Text marginTop="2">
          A PDF lands on the canvas, and anything you draw on top of it stays yours.
        </Text>

        <Button
          disabled={isBusy}
          marginTop="6"
          variant="solid"
          w="full"
          onClick={() => inputRef.current?.click()}
        >
          {isBusy ? 'Opening' : 'Open PDF'}
        </Button>
        <Button disabled={isBusy} marginTop="2" variant="outline" w="full" onClick={onUseExample}>
          Use an example
        </Button>
      </Box>

      <input accept="application/pdf" hidden onChange={handlePick} ref={inputRef} type="file" />
    </Flex>
  )
}
