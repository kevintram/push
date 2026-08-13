import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'

import { colors } from '~/styles/colors.stylex'
import { iconSizes, radii, spacing } from '~/styles/tokens.stylex'

import { DialogOverlay } from './DialogOverlay'

export interface DialogContentProps extends Omit<
	DialogPrimitive.Popup.Props,
	'className' | 'style'
> {
	showCloseButton?: boolean
	size?: 'default' | 'fullscreen'
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
	viewportFullscreen: {
		padding: spacing.none,
		placeItems: 'stretch',
		overflowY: 'hidden',
	},
	popup: {
		position: 'relative',

		padding: spacing.xl,
		gap: spacing.lg,
		display: 'grid',
		inlineSize: '100%',
		maxInlineSize: '32rem',

		borderColor: colors.border,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: colors.bgSurface,
		boxShadow: `0 16px 48px ${colors.shadowStrong}`,
		color: colors.text,
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
	popupFullscreen: {
		blockSize: '100dvh',
		inlineSize: '100dvw',
		maxInlineSize: 'none',

		paddingBlockEnd: `max(${spacing.xl}, env(safe-area-inset-bottom))`,
		paddingBlockStart: `max(${spacing.xl}, env(safe-area-inset-top))`,
		paddingInlineEnd: `max(${spacing.xl}, env(safe-area-inset-right))`,
		paddingInlineStart: `max(${spacing.xl}, env(safe-area-inset-left))`,

		borderRadius: 0,
		borderWidth: '0px',
		backgroundColor: colors.bg,
		boxShadow: 'none',
		transform: {
			default: 'none',
			':is([data-starting-style], [data-ending-style])': 'none',
		},
		overflowY: 'auto',
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
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':hover': colors.bgFillTransparentHover,
			':active': colors.bgFillTransparentActive,
		},
		color: 'inherit',
		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
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
	size = 'default',
	xstyle,
	...props
}: DialogContentProps) {
	const isFullscreen = size === 'fullscreen'

	return (
		<DialogPrimitive.Portal>
			<DialogOverlay />
			<DialogPrimitive.Viewport
				{...stylex.props(
					styles.viewport,
					isFullscreen && styles.viewportFullscreen,
				)}
			>
				<DialogPrimitive.Popup
					{...stylex.props(
						styles.popup,
						isFullscreen && styles.popupFullscreen,
						xstyle,
					)}
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
