import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import * as stylex from '@stylexjs/stylex'

import { breakpoints, spacing } from '~/styles/tokens.stylex'

import { ToastList } from './ToastList'
import { toast } from './toastManager'

const styles = stylex.create({
	viewport: {
		marginInline: {
			default: 'auto',
			[breakpoints.tablet]: 0,
		},
		insetInlineEnd: spacing.lg,
		insetInlineStart: {
			default: spacing.lg,
			[breakpoints.tablet]: 'auto',
		},

		position: 'fixed',
		bottom: spacing.lg,

		maxWidth: '24rem',
		width: {
			default: 'auto',
			[breakpoints.tablet]: '100%',
		},

		outline: 'none',
		pointerEvents: 'none',
		zIndex: 50,
	},
})

export function Toaster({
	children,
	toastManager = toast,
	...props
}: ToastPrimitive.Provider.Props) {
	return (
		<ToastPrimitive.Provider toastManager={toastManager} {...props}>
			{children}
			<ToastPrimitive.Portal>
				<ToastPrimitive.Viewport {...stylex.props(styles.viewport)}>
					<ToastList />
				</ToastPrimitive.Viewport>
			</ToastPrimitive.Portal>
		</ToastPrimitive.Provider>
	)
}
