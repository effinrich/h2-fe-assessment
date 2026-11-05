import { Button, FileUpload, Stack } from "@h2-fe/ui"

import type { HomeScreenProps } from "../types"

type HomeOpenActionsProps = Pick<HomeScreenProps, "onFileChange" | "onUseExample" | "isBusy">

/** Two of the three ways in: pick a file, or use the generated example. */
export function HomeOpenActions({ onFileChange, onUseExample, isBusy }: HomeOpenActionsProps) {
  return (
    <Stack alignItems="start" direction={{ base: "column", sm: "row" }} gap="2" w="full">
      <FileUpload.Root
        accept="application/pdf"
        disabled={isBusy}
        maxFiles={1}
        w={{ base: "full", sm: "auto" }}
      >
        <FileUpload.HiddenInput onChange={onFileChange} />
        <FileUpload.Trigger asChild>
          <Button
            colorPalette="ink"
            disabled={isBusy}
            variant="solid"
            w={{ base: "full", sm: "auto" }}
          >
            {isBusy ? "Opening" : "Open PDF"}
          </Button>
        </FileUpload.Trigger>
      </FileUpload.Root>
      <Button
        disabled={isBusy}
        onClick={onUseExample}
        variant="outline"
        w={{ base: "full", sm: "auto" }}
      >
        Use an example
      </Button>
    </Stack>
  )
}
