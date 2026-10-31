import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import { X } from 'lucide-react'

import { iconSizes } from '~/styles/tokens.stylex'

import { Button } from '../Button/Button'

export function ToastClose({
	children,
	render = <Button iconOnly size='micro' variant='ghost' shape='round' />,
	...props
}: ToastPrimitive.Close.Props) {
	return (
		<ToastPrimitive.Close
			aria-label='Close toast'
			data-slot='toast-close'
			render={render}
			{...props}
		>
			{children ?? <X aria-hidden='true' size={iconSizes.xs} />}
		</ToastPrimitive.Close>
	)
}
