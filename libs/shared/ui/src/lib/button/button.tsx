import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import { forwardRef, type ReactNode } from "react"

export interface ButtonProps extends ChakraButtonProps {
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, ...props },
  ref
) {
  return (
    <ChakraButton ref={ref} {...props}>
      {children}
    </ChakraButton>
  )
})
