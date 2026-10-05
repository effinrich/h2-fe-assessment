import { Field, Input } from "@h2-fe/ui"

import { NO_SPINNER_CSS } from "../consts"
import { usePageJump } from "../hooks"

interface ViewerPageInputProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ViewerPageInput({ page, totalPages, onPageChange }: ViewerPageInputProps) {
  const { pageInput, jump, abandonJump } = usePageJump(page, totalPages, onPageChange)

  return (
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
          css={NO_SPINNER_CSS}
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
  )
}
