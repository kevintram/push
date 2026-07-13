import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'

export { DialogContent, type DialogContentProps } from './DialogContent'
export {
	DialogDescription,
	type DialogDescriptionProps,
} from './DialogDescription'
export { DialogFooter, type DialogFooterProps } from './DialogFooter'
export { DialogHeader, type DialogHeaderProps } from './DialogHeader'
export { DialogOverlay, type DialogOverlayProps } from './DialogOverlay'
export { DialogTitle, type DialogTitleProps } from './DialogTitle'

export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close
export const DialogPortal = DialogPrimitive.Portal
export const DialogTrigger = DialogPrimitive.Trigger
export const createDialogHandle = DialogPrimitive.createHandle
