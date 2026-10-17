import * as stylex from '@stylexjs/stylex'
import {
	ChevronDown,
	ChevronsUpDown,
	ChevronUp,
	type LucideIcon,
} from 'lucide-react'

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

import type { OffscreenDirection } from './useOffscreenDirection'

// The pill enters from the edge it sits on.
const enterUp = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(4px) scale(0.96)' },
	to: { opacity: 1, transform: 'none' },
})

const enterDown = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(-4px) scale(0.96)' },
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
		display: 'flex',
		inlineSize: 'fit-content',
		insetInlineEnd: 0,
		insetInlineStart: 0,
		marginInlineEnd: 'auto',
		marginInlineStart: 'auto',
		maxInlineSize: `calc(100% - 2 * ${spacing.lg})`,
		position: 'absolute',

		backgroundColor: revealSelectionPillColors.background,
		boxShadow: `0 4px 12px ${revealSelectionPillColors.shadow}`,
		color: revealSelectionPillColors.foreground,
		fontFamily: 'inherit',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,

		animationDuration: '200ms',
		animationName: {
			default: enterUp,
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
	top: {
		animationName: {
			default: enterDown,
			'@media (prefers-reduced-motion: reduce)': 'none',
		},
		insetBlockStart: spacing.sm,
	},
	bottom: {
		insetBlockEnd: spacing.sm,
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

/**
 * Where the selected collection is hidden: inside a collapsed branch, or
 * scrolled out of view above or below the visible rows.
 */
export type HiddenSelectionPosition = 'collapsed' | OffscreenDirection

// The collapsed icon mirrors the Collapse all button's ChevronsDownUp.
const icons: Record<HiddenSelectionPosition, LucideIcon> = {
	collapsed: ChevronsUpDown,
	above: ChevronUp,
	below: ChevronDown,
}

type RevealSelectionPillProps = {
	title: string
	position: HiddenSelectionPosition
	onClick: () => void
}

/**
 * Names the selected collection while it is hidden in the library tree and
 * reveals it when clicked. It floats over the bottom edge of its positioned
 * container, or over the top edge when the selection is above.
 */
export function RevealSelectionPill({
	title,
	position,
	onClick,
}: RevealSelectionPillProps) {
	const Icon = icons[position]

	return (
		<button
			type='button'
			aria-label={`Show ${title} in library`}
			onClick={onClick}
			{...stylex.props(
				styles.pill,
				position === 'above' ? styles.top : styles.bottom,
			)}
		>
			<Icon
				aria-hidden='true'
				size={iconSizes.sm}
				strokeWidth={iconWeights.medium}
				{...stylex.props(styles.icon)}
			/>
			<span {...stylex.props(styles.title)}>{title}</span>
		</button>
	)
}
