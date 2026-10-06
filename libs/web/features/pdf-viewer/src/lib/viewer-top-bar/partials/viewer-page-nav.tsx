import { ChevronLeft, ChevronRight } from "lucide-react"

import { chakra, Flex, IconButton, Text } from "@h2-fe/ui"

import { ViewerPageInput } from "./viewer-page-input"

interface ViewerPageNavProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** ‹ [page] / total › */
export function ViewerPageNav({ page, totalPages, onPageChange }: ViewerPageNavProps) {
  return (
    <Flex align="center" fontFamily="mono" fontSize="sm" fontVariantNumeric="tabular-nums" gap="1">
      <IconButton
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        size="sm"
        variant="ghost"
      >
        <ChevronLeft />
      </IconButton>
      <ViewerPageInput onPageChange={onPageChange} page={page} totalPages={totalPages} />
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
  )
}
