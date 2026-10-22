import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import { X } from 'lucide-react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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

		borderColor: colorsSemantic.borderSubtle,
		borderRadius: radii.xl,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: colorsSemantic.surfaceRaised,
		boxShadow: `0 16px 48px ${colorsSemantic.shadowStrong}`,
		color: colorsSemantic.textPrimary,
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

		borderColor: colorsSemantic.surfaceTransparent,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceTransparentHover,
			':active': colorsSemantic.surfaceTransparentActive,
		},
		color: 'inherit',
		cursor: 'pointer',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '120ms',
		transitionProperty: 'background-color',
	},
	icon: {
		blockSize: iconSizes.sm,
		inlineSize: iconSizes.sm,
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
