import { Menu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import { Circle } from 'lucide-react'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

// A mark inside the control rather than a glyph beside text, so it sits
// outside the iconSizes scale.
const RADIO_DOT_SIZE = '0.75rem' // 12px

const styles = stylex.create({
	item: {
		paddingBlock: '6px',
		paddingInlineEnd: spacing.sm,
		paddingInlineStart: spacing['2xl'],

		alignItems: 'center',
		display: 'flex',
		position: 'relative',

		borderRadius: radii.xs,
		outline: 'none',
		backgroundColor: {
			default: semanticColors.surfaceTransparent,
			':is([data-highlighted])': semanticColors.surfaceTransparentHover,
		},
		color: {
			default: semanticColors.textInteractive,
			':is([data-highlighted])': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
		},
		cursor: 'default',
		fontSize: fontSizes.sm,
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
	innerContainer: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'flex',
	},
	content: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'inline-flex',
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none',
	},
	indicator: {
		alignItems: 'center',
		display: 'flex',
		insetInlineStart: spacing.sm,
		justifyContent: 'center',
		position: 'absolute',
	},
	slot: {
		alignItems: 'center',
		display: 'inline-flex',
		flexShrink: 0,
		justifyContent: 'center',
	},
})

export interface DropdownMenuRadioItemProps extends Omit<
	React.ComponentProps<typeof Menu.RadioItem>,
	'className' | 'style' | 'prefix' | 'suffix'
> {
	prefix?: React.ReactNode
	suffix?: React.ReactNode
}

export function DropdownMenuRadioItem({
	children,
	disabled,
	prefix,
	suffix,
	...props
}: DropdownMenuRadioItemProps) {
	return (
		<Menu.RadioItem
			disabled={disabled}
			{...stylex.props(styles.item, disabled && styles.disabled)}
			{...props}
		>
			<Menu.RadioItemIndicator {...stylex.props(styles.indicator)}>
				<Circle aria-hidden fill='currentColor' size={RADIO_DOT_SIZE} />
			</Menu.RadioItemIndicator>
			<div {...stylex.props(styles.innerContainer)}>
				{prefix && <span {...stylex.props(styles.slot)}>{prefix}</span>}
				<span {...stylex.props(styles.content)}>{children}</span>
				{suffix && <span {...stylex.props(styles.slot)}>{suffix}</span>}
			</div>
		</Menu.RadioItem>
	)
}
