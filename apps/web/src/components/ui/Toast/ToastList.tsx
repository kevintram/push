import { Toast as ToastPrimitive } from '@base-ui/react/toast'

import { ToastItem } from './ToastItem'

export function ToastList() {
	const { toasts } = ToastPrimitive.useToastManager()

	return toasts.map((toastItem, index) => (
		<ToastItem key={toastItem.id} index={index} toastItem={toastItem} />
	))
}
