import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import {
	formatStrength,
	formatStrengthDelta,
	formatStrengthTooltip,
	getStrengthDelta,
	getStrengthLevel,
} from '../utils/cardSrs'

const styles = stylex.create({
	container: {
		alignItems: 'center',
		columnGap: spacing.xs,
		display: 'inline-flex',
		whiteSpace: 'nowrap',
	},
	empty: {
		color: colorsSemantic.textSecondary,
	},
	bars: {
		blockSize: iconSizes.sm,
		flexShrink: 0,
		inlineSize: iconSizes.sm,
	},
	bar: {
		fill: colorsSemantic.borderPrimary,
	},
	filledBar: {
		fill: colorsSemantic.textSecondary,
	},
	positiveChange: {
		color: colorsSemantic.textSuccess,
	},
	negativeChange: {
		color: colorsSemantic.textDanger,
	},
})

// Rising bars in a 22×24 box, shortest first.
const BARS = [
	{ x: 1.5, y: 16, height: 5 },
	{ x: 6.5, y: 12, height: 9 },
	{ x: 11.5, y: 8, height: 13 },
	{ x: 16.5, y: 4, height: 17 },
] as const

type StrengthSignalProps = {
	stability: number | null
	/**
	 * Show the change from this stability, or `new` when `null`. Omit it to
	 * hide the change.
	 */
	stabilityBefore?: number | null
	/** Skip the screen-reader label when a visible label already names it. */
	hasVisibleLabel?: boolean
	/** Style the change, such as hiding it where space runs out. */
	changeXstyle?: StyleXStyles
	xstyle?: StyleXStyles
}

/** Signal bars and label for FSRS stability, with an optional change. */
export function StrengthSignal({
	stability,
	stabilityBefore,
	hasVisibleLabel = false,
	changeXstyle,
	xstyle,
}: StrengthSignalProps) {
	const label = hasVisibleLabel ? null : (
		<span {...stylex.props(a11y.visuallyHidden)}>Strength </span>
	)

	if (stability === null) {
		return (
			<span {...stylex.props(styles.container, styles.empty, xstyle)}>
				{label}—
			</span>
		)
	}

	const level = getStrengthLevel(stability)
	const delta =
		stabilityBefore === undefined
			? undefined
			: getStrengthDelta(stabilityBefore, stability)

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span {...stylex.props(styles.container, xstyle)}>
						{label}
						<svg
							aria-hidden='true'
							viewBox='0 0 22 24'
							{...stylex.props(styles.bars)}
						>
							{BARS.map((bar, index) => (
								<rect
									key={bar.x}
									height={bar.height}
									rx={2}
									width={4}
									x={bar.x}
									y={bar.y}
									{...stylex.props(
										styles.bar,
										index < level && styles.filledBar,
									)}
								/>
							))}
						</svg>
						<span>{formatStrength(stability)}</span>
						{delta !== undefined && (
							<span
								{...stylex.props(
									delta !== null && delta < 0
										? styles.negativeChange
										: styles.positiveChange,
									changeXstyle,
								)}
							>
								({formatStrengthDelta(delta)})
							</span>
						)}
					</span>
				}
			/>
			<TooltipContent>{formatStrengthTooltip(stability)}</TooltipContent>
		</Tooltip>
	)
}
