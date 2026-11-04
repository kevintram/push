import { Toast as ToastPrimitive } from '@base-ui/react/toast'
import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

import { ToastList } from './ToastList'
import { toast } from './toastManager'

const styles = stylex.create({
	// Top center: the page toolbars keep their middle empty, while the
	// bottom corners hold the selection bar and the review composer.
	viewport: {
		insetInline: spacing.lg,
		marginInline: 'auto',

		position: 'fixed',
		top: spacing.lg,

		maxWidth: '24rem',

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
