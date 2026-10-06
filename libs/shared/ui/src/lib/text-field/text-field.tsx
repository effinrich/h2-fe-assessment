import { Field, Input, type InputProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface TextFieldProps extends InputProps {
  label: ReactNode
  helperText?: ReactNode
  /** Marks the field invalid and is announced as the input's description. */
  errorText?: ReactNode
}

export function TextField({
  label,
  helperText,
  errorText,
  required,
  disabled,
  readOnly,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field.Root
      invalid={Boolean(errorText)}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Field.Label>
        {label}
        <Field.RequiredIndicator />
      </Field.Label>
      <Input {...inputProps} />
      {helperText ? <Field.HelperText>{helperText}</Field.HelperText> : null}
      <Field.ErrorText>{errorText}</Field.ErrorText>
    </Field.Root>
  )
}
