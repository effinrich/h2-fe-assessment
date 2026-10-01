import { Tag as ChakraTag } from '@chakra-ui/react';
import type { ReactNode } from 'react';

export interface TagProps extends ChakraTag.RootProps {
  startElement?: ReactNode;
  endElement?: ReactNode;
  /** Renders a remove button that calls this. */
  onClose?: () => void;
  closeLabel?: string;
}

export function Tag({ startElement, endElement, onClose, closeLabel = 'Remove', children, ...rootProps }: TagProps) {
  return (
    <ChakraTag.Root {...rootProps}>
      {startElement ? <ChakraTag.StartElement>{startElement}</ChakraTag.StartElement> : null}
      <ChakraTag.Label>{children}</ChakraTag.Label>
      {endElement ? <ChakraTag.EndElement>{endElement}</ChakraTag.EndElement> : null}
      {onClose ? (
        <ChakraTag.EndElement>
          <ChakraTag.CloseTrigger aria-label={closeLabel} onClick={onClose} />
        </ChakraTag.EndElement>
      ) : null}
    </ChakraTag.Root>
  );
}
