import * as stylex from '@stylexjs/stylex'
import { ChevronRight } from 'lucide-react'

import { revealSelectionPillColors } from '~/styles/colors/components.stylex'
import {
	buttonSizes,
	fontSizes,
	fontWeights,
	iconSizes,
	iconWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

const enter = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(4px) scale(0.96)' },
	to: { opacity: 1, transform: 'none' },
})

const styles = stylex.create({
	pill: {
		borderRadius: radii.full,
		borderWidth: 0,
		gap: spacing.xs,
		paddingBlock: spacing.none,
		paddingInlineEnd: spacing.md,
		paddingInlineStart: spacing.sm,

		alignItems: 'center',
		blockSize: buttonSizes.tiny,
		display: 'inline-flex',
		maxInlineSize: '100%',

		backgroundColor: revealSelectionPillColors.background,
		boxShadow: `0 4px 12px ${revealSelectionPillColors.shadow}`,
		color: revealSelectionPillColors.foreground,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,

		animationDuration: '200ms',
		animationName: {
			default: enter,
			'@media (prefers-reduced-motion: reduce)': 'none',
		},
		animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		cursor: 'pointer',
		outlineColor: {
			default: revealSelectionPillColors.focusRingRest,
			':focus-visible': revealSelectionPillColors.focusRing,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transform: {
			default: 'scale(1)',
			':active': 'scale(0.97)',
		},
		transitionDuration: {
			default: '125ms',
			'@media (prefers-reduced-motion: reduce)': '1ms',
		},
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
		userSelect: 'none',
	},
	icon: {
		color: revealSelectionPillColors.iconForeground,
		flexShrink: 0,
	},
	title: {
		overflow: 'hidden',
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})

type RevealSelectionPillProps = {
	title: string
	onClick: () => void
	xstyle?: stylex.StyleXStyles
}

/**
 * Names the selected collection while it is hidden in the library tree and
 * reveals it when clicked.
 */
export function RevealSelectionPill({
	title,
	onClick,
	xstyle,
}: RevealSelectionPillProps) {
	return (
		<button
			type='button'
			aria-label={`Show ${title} in library`}
			onClick={onClick}
			{...stylex.props(styles.pill, xstyle)}
		>
			<ChevronRight
				aria-hidden='true'
				size={iconSizes.sm}
				strokeWidth={iconWeights.medium}
				{...stylex.props(styles.icon)}
			/>
			<span {...stylex.props(styles.title)}>{title}</span>
		</button>
	)
}
