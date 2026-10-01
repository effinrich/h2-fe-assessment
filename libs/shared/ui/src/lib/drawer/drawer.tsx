import { CloseButton, Drawer as ChakraDrawer, Portal } from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

export interface DrawerProps {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** A single element that opens the drawer; omit it to control `open` yourself. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: ChakraDrawer.RootProps['placement'];
  size?: ChakraDrawer.RootProps['size'];
  closeLabel?: string;
}

export function Drawer({
  title,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  placement = 'end',
  size,
  closeLabel = 'Close',
}: DrawerProps) {
  return (
    <ChakraDrawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      placement={placement}
      size={size}
      lazyMount
      unmountOnExit
    >
      {trigger ? <ChakraDrawer.Trigger asChild>{trigger}</ChakraDrawer.Trigger> : null}
      <Portal>
        <ChakraDrawer.Backdrop />
        <ChakraDrawer.Positioner>
          <ChakraDrawer.Content>
            <ChakraDrawer.Header>
              <ChakraDrawer.Title>{title}</ChakraDrawer.Title>
            </ChakraDrawer.Header>
            <ChakraDrawer.Body>{children}</ChakraDrawer.Body>
            {footer ? <ChakraDrawer.Footer>{footer}</ChakraDrawer.Footer> : null}
            <ChakraDrawer.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={closeLabel} />
            </ChakraDrawer.CloseTrigger>
          </ChakraDrawer.Content>
        </ChakraDrawer.Positioner>
      </Portal>
    </ChakraDrawer.Root>
  );
}
