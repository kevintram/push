import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { LucideIcon } from 'lucide-react'

/** A button that follows a change to its result, such as where it moved. */
export type ToastOpen = { label: string; onClick: () => void }

export type ToastData = {
	/** Describes the completed action instead of the generic status. */
	icon?: LucideIcon
	/** Matches the action’s resulting on/off appearance. */
	iconXstyle?: StyleXStyles
	/** Shown after the action, and closes the toast. */
	open?: ToastOpen
}

export const toast = ToastPrimitive.createToastManager<ToastData>()
