import * as stylex from '@stylexjs/stylex'
import { Anvil } from 'lucide-react'

import {
	type ButtonSize,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { reviewColors } from '~/styles/colors/components.stylex'
import { fontSizes, iconSizes, spacing } from '~/styles/tokens.stylex'

import type { Review } from '../types/review.types'
import { formatDurabilityTooltip } from '../utils/cardSrs'

const styles = stylex.create({
	container: {
		alignItems: 'center',
		color: reviewColors.durabilityForeground,
		columnGap: spacing.xs,
		display: 'flex',
		whiteSpace: 'nowrap',
	},
	icon: {
		blockSize: iconSizes.md,
		inlineSize: iconSizes.md,
	},
	positiveChange: {
		color: reviewColors.durabilityPositiveChangeForeground,
	},
	negativeChange: {
		color: reviewColors.durabilityNegativeChangeForeground,
	},
})

const sizeVariants = stylex.create({
	micro: { fontSize: fontSizes.sm },
	tiny: { fontSize: fontSizes.sm },
	small: { fontSize: fontSizes.md },
	medium: { fontSize: fontSizes.md },
	large: { fontSize: fontSizes.md },
})

type ReviewDurabilityProps = {
	review: Review
	size?: ButtonSize
}

export function ReviewDurability({
	review,
	size = 'medium',
}: ReviewDurabilityProps) {
	const stabilityAfter =
		review.stabilityAfter === undefined
			? null
			: Math.round(review.stabilityAfter)

	if (stabilityAfter === null) {
		return null
	}

	const stabilityDelta =
		review.stabilityBefore === undefined ||
		review.stabilityAfter === undefined
			? null
			: Math.round(review.stabilityAfter - review.stabilityBefore)
	const stabilityChange =
		stabilityDelta === null
			? 'new'
			: `${stabilityDelta >= 0 ? '+' : ''}${stabilityDelta}`
	const stabilityChangeStyle =
		stabilityDelta === null || stabilityDelta >= 0
			? styles.positiveChange
			: styles.negativeChange

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<div
						{...stylex.props(styles.container, sizeVariants[size])}
					>
						<Anvil
							aria-hidden='true'
							{...stylex.props(styles.icon)}
						/>
						<span>{stabilityAfter}d</span>
						<span {...stylex.props(stabilityChangeStyle)}>
							({stabilityChange})
						</span>
					</div>
				}
			/>
			<TooltipContent>
				{formatDurabilityTooltip(stabilityAfter)}
			</TooltipContent>
		</Tooltip>
	)
}
