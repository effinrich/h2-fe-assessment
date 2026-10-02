import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react";

export interface ButtonProps extends ChakraButtonProps {
  children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return <ChakraButton {...props}>{children}</ChakraButton>;
}
