import { HStack, IconButton, Pagination as ChakraPagination } from "@chakra-ui/react"

import { ChevronLeftIcon } from "./partials/chevron-left-icon"
import { ChevronRightIcon } from "./partials/chevron-right-icon"

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
            <ChevronLeftIcon />
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
            <ChevronRightIcon />
          </IconButton>
        </ChakraPagination.NextTrigger>
      </HStack>
    </ChakraPagination.Root>
  )
}
