import { Button, FileUpload, Flex, Heading, Stack, Text } from "@h2-fe/ui"

import type { HomeScreenProps } from "./types"

// The route's own composition: teach what the canvas is for and offer two ways
// in. The route provides callbacks; this screen holds only markup.
export function HomeScreen({ onFileChange, onUseExample, isBusy = false }: HomeScreenProps) {
  return (
    <Flex align="center" justify="center" minH="100dvh" p={{ base: "4", md: "8" }}>
      <Stack
        bg="bg.panel"
        borderColor="border"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="lg"
        color="fg"
        gap="6"
        maxW="sm"
        p={{ base: "6", md: "8" }}
        w="full"
      >
        <Stack gap="2">
          <Heading size="lg">Open a document</Heading>
          <Text>A PDF lands on the canvas, ready to mark up.</Text>
        </Stack>
        <Stack gap="2">
          <FileUpload.Root accept="application/pdf" disabled={isBusy} maxFiles={1} w="full">
            <FileUpload.HiddenInput onChange={onFileChange} />
            <FileUpload.Trigger asChild>
              <Button disabled={isBusy} variant="solid" w="full">
                {isBusy ? "Opening" : "Open PDF"}
              </Button>
            </FileUpload.Trigger>
          </FileUpload.Root>
          <Button disabled={isBusy} variant="outline" w="full" onClick={onUseExample}>
            Use an example
          </Button>
        </Stack>
      </Stack>
    </Flex>
  )
}
