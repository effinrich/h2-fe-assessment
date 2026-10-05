import { Button, Flex, Modal, Text } from "@h2-fe/ui"

interface LeaveDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
}

export function LeaveDocumentModal({ open, onOpenChange, onDiscard }: LeaveDocumentModalProps) {
  return (
    <Modal
      footer={
        <Flex gap="3">
          <Button onClick={() => onOpenChange(false)}>Keep working</Button>
          <Button colorPalette="red" onClick={onDiscard} variant="outline">
            Discard marks
          </Button>
        </Flex>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Leave this document?"
    >
      <Text>Your marks aren't saved and will be lost.</Text>
    </Modal>
  )
}
