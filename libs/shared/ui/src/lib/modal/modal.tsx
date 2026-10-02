import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import type { ReactElement, ReactNode } from "react";

export interface ModalProps {
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** A single element that opens the modal; omit it to control `open` yourself. */
  trigger?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: Dialog.RootProps["size"];
  closeLabel?: string;
}

export function Modal({
  title,
  children,
  footer,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  size,
  closeLabel = "Close",
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      size={size}
      lazyMount
      unmountOnExit
    >
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            {footer ? <Dialog.Footer>{footer}</Dialog.Footer> : null}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={closeLabel} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
