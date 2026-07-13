import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'

import { colors, iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { DialogOverlay } from './DialogOverlay'

export interface DialogContentProps extends Omit<
	DialogPrimitive.Popup.Props,
	'className' | 'style'
> {
	showCloseButton?: boolean
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	viewport: {
		inset: 0,
		position: 'fixed',
		zIndex: 50,

		padding: spacing.lg,
		placeItems: 'center',
		display: 'grid',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	popup: {
		position: 'relative',

		padding: spacing.xl,
		gap: spacing.lg,
		display: 'grid',
		inlineSize: '100%',
		maxInlineSize: '32rem',

		borderColor: colors.border,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: colors.surface,
		boxShadow: '0 16px 48px rgb(0 0 0 / 0.18)',
		color: colors.foreground,
		opacity: {
			default: 1,
			':is([data-starting-style], [data-ending-style])': 0,
		},
		transform: {
			default: 'scale(1)',
			':is([data-starting-style], [data-ending-style])': 'scale(0.96)',
		},
		transitionDuration: {
			default: '120ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'ease-out',
	},
	close: {
		insetBlockStart: spacing.sm,
		insetInlineEnd: spacing.sm,
		position: 'absolute',

		alignItems: 'center',
		blockSize: '32px',
		display: 'inline-flex',
		inlineSize: '32px',
		justifyContent: 'center',

		borderColor: 'transparent',
		borderRadius: radii.md,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: 'transparent',
			':hover': colors.secondary,
		},
		color: colors.mutedForeground,
		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '120ms',
		transitionProperty: 'background-color, color',
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
	},
})

export function DialogContent({
	children,
	showCloseButton = true,
	xstyle,
	...props
}: DialogContentProps) {
	return (
		<DialogPrimitive.Portal>
			<DialogOverlay />
			<DialogPrimitive.Viewport {...stylex.props(styles.viewport)}>
				<DialogPrimitive.Popup
					{...stylex.props(styles.popup, xstyle)}
					{...props}
				>
					{children}
					{showCloseButton && (
						<DialogPrimitive.Close
							aria-label='Close'
							{...stylex.props(styles.close)}
						>
							<X
								aria-hidden='true'
								{...stylex.props(styles.icon)}
							/>
						</DialogPrimitive.Close>
					)}
				</DialogPrimitive.Popup>
			</DialogPrimitive.Viewport>
		</DialogPrimitive.Portal>
	)
}
