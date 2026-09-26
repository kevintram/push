import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'

import { dialogColors } from '~/styles/colors/components.stylex'
import { iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { DialogOverlay } from './DialogOverlay'

export interface DialogContentProps extends Omit<
	DialogPrimitive.Popup.Props,
	'className' | 'style'
> {
	showCloseButton?: boolean
	viewportXstyle?: stylex.StyleXStyles
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

		padding: spacing.md,
		gap: spacing.lg,
		display: 'grid',
		inlineSize: '100%',
		maxInlineSize: '32rem',

		borderColor: dialogColors.popupBorder,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: dialogColors.popupBackground,
		boxShadow: `0 16px 48px ${dialogColors.popupShadow}`,
		color: dialogColors.popupForeground,
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

		borderColor: dialogColors.closeButtonBorder,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: dialogColors.closeButtonBackground,
			':hover': dialogColors.closeButtonBackgroundHover,
			':active': dialogColors.closeButtonBackgroundPressed,
		},
		color: 'inherit',
		cursor: 'pointer',
		outlineColor: {
			default: dialogColors.closeButtonFocusRingRest,
			':focus-visible': dialogColors.closeButtonFocusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '120ms',
		transitionProperty: 'background-color',
	},
	icon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
})

export function DialogContent({
	children,
	showCloseButton = true,
	viewportXstyle,
	xstyle,
	...props
}: DialogContentProps) {
	return (
		<DialogPrimitive.Portal>
			<DialogOverlay />
			<DialogPrimitive.Viewport
				{...stylex.props(styles.viewport, viewportXstyle)}
			>
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
