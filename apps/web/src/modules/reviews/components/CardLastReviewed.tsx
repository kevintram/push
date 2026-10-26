import * as stylex from '@stylexjs/stylex'
import { Sparkles } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
// StyleX's dev server only resolves shared constants through the `~` alias.
import { cardTable } from '~/modules/reviews/components/cardTable.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { formatRelativeDate } from '~/utils/date'

import type { Rating } from '../types/review.types'
import { getLastReviewedDetails } from './reviewRatings'

const styles = stylex.create({
	item: {
		alignItems: 'center',
		columnGap: spacing.xs,
		display: 'inline-flex',
		whiteSpace: 'nowrap',

		color: colorsSemantic.textSecondary,
	},
	today: { color: colorsSemantic.textToday },
	// Stacked, a new card's line reads "New" in place of its dates. The table
	// keeps the column and says "Never".
	never: {
		color: colorsSemantic.textTertiary,
		display: {
			default: 'none',
			[cardTable.wide]: 'inline',
		},
	},
	new: {
		display: {
			default: 'inline-flex',
			[cardTable.wide]: 'none',
		},
	},
})

type CardLastReviewedProps = {
	lastReviewedAt: DateString | null
	lastRating: Rating | null
	today: DateString
}

/** When a card was last reviewed and how, or that it is new. */
export function CardLastReviewed({
	lastReviewedAt,
	lastRating,
	today,
}: CardLastReviewedProps) {
	if (lastReviewedAt === null) {
		return (
			<>
				<span {...stylex.props(styles.never)}>Never</span>
				<Tooltip>
					<TooltipTrigger
						render={
							<span {...stylex.props(styles.item, styles.new)} />
						}
					>
						<Sparkles aria-hidden='true' size={iconSizes.sm} />
						New
					</TooltipTrigger>
					<TooltipContent>Not reviewed yet</TooltipContent>
				</Tooltip>
			</>
		)
	}

	const { Icon, ariaLabel, tooltip } = getLastReviewedDetails(
		lastReviewedAt,
		lastRating,
	)

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						aria-label={ariaLabel}
						{...stylex.props(
							styles.item,
							lastReviewedAt === today && styles.today,
						)}
					/>
				}
			>
				{Icon ? <Icon aria-hidden='true' size={iconSizes.sm} /> : null}
				{formatRelativeDate(lastReviewedAt, today)}
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	)
}
