import { Popover } from '@base-ui/react/popover'
import * as stylex from '@stylexjs/stylex'
import { HotkeysProvider } from '@tanstack/react-hotkeys'
import { useId, useState } from 'react'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

export interface PopoverPopupProps extends Omit<
	React.ComponentProps<typeof Popover.Popup>,
	'className' | 'style'
> {
	align?: React.ComponentProps<typeof Popover.Positioner>['align']
	alignOffset?: React.ComponentProps<typeof Popover.Positioner>['alignOffset']
	collisionAvoidance?: React.ComponentProps<
		typeof Popover.Positioner
	>['collisionAvoidance']
	side?: React.ComponentProps<typeof Popover.Positioner>['side']
	sideOffset?: React.ComponentProps<typeof Popover.Positioner>['sideOffset']
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	positioner: { zIndex: 50 },
	popup: {
		padding: spacing.lg,

		borderColor: colorsSemantic.borderPrimary,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		outline: 'none',
		backgroundColor: colorsSemantic.surfaceRaised,
		boxShadow: `0 8px 24px ${colorsSemantic.shadowPrimary}`,
		color: colorsSemantic.textPrimary,
		opacity: {
			default: 1,
			':is([data-starting-style], [data-ending-style])': 0,
		},
		transform: {
			default: 'scale(1)',
			':is([data-starting-style], [data-ending-style])': 'scale(0.96)',
		},
		transformOrigin: 'var(--transform-origin)',
		transitionDuration: {
			default: '120ms',
			'@media (prefers-reduced-motion: reduce)': '0ms',
		},
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'ease-out',
	},
})

/**
 * A popover's positioned popup. While focus is inside, it owns the keyboard:
 * page hotkeys are suspended, so a key pressed here can't act on the page
 * behind it. A hover popover without focus leaves them alone.
 *
 * It renders only while the popover is open, so its focus state starts fresh
 * on every opening; a popup removed with focus inside gets no blur event.
 */
export function PopoverPopup({
	align = 'center',
	alignOffset,
	collisionAvoidance,
	side = 'bottom',
	sideOffset = 4,
	xstyle,
	onBlur,
	onFocus,
	...props
}: PopoverPopupProps) {
	const scope = `popover-${useId()}`
	const [hasFocus, setHasFocus] = useState(false)

	return (
		<HotkeysProvider scope={scope} exclusive enabled={hasFocus}>
			<Popover.Positioner
				align={align}
				alignOffset={alignOffset}
				collisionAvoidance={collisionAvoidance}
				side={side}
				sideOffset={sideOffset}
				{...stylex.props(styles.positioner)}
			>
				<Popover.Popup
					{...stylex.props(styles.popup, xstyle)}
					{...props}
					onFocus={event => {
						setHasFocus(true)
						onFocus?.(event)
					}}
					onBlur={event => {
						const next = event.relatedTarget as Node | null
						if (!event.currentTarget.contains(next))
							setHasFocus(false)
						onBlur?.(event)
					}}
				/>
			</Popover.Positioner>
		</HotkeysProvider>
	)
}
