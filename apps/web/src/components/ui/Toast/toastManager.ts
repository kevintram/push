import { Toast as ToastPrimitive } from '@base-ui/react/toast'

/** A button that follows a change to its result, such as where it moved. */
export type ToastOpen = { label: string; onClick: () => void }

export type ToastData = {
	/** Shown after the action, and closes the toast. */
	open?: ToastOpen
}

export const toast = ToastPrimitive.createToastManager<ToastData>()
