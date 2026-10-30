import * as stylex from '@stylexjs/stylex'
import { Sparkles } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { a11y } from '~/styles/a11y'
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
	empty: { color: colorsSemantic.textTertiary },
})

type CardLastReviewedProps = {
	lastReviewedAt: DateString | null
	lastRating: Rating | null
	today: DateString
	/**
	 * A new card's details line reads "New" in place of its dates. The table
	 * keeps the column with a dash, like an empty due date.
	 */
	variant: 'column' | 'details'
}

/** When a card was last reviewed and how, or that it is new. */
export function CardLastReviewed({
	lastReviewedAt,
	lastRating,
	today,
	variant,
}: CardLastReviewedProps) {
	if (lastReviewedAt === null) {
		return variant === 'column' ? (
			<span {...stylex.props(styles.empty)}>
				<span aria-hidden='true'>—</span>
				<span {...stylex.props(a11y.visuallyHidden)}>Never</span>
			</span>
		) : (
			<Tooltip>
				<TooltipTrigger
					render={<span {...stylex.props(styles.item)} />}
				>
					<Sparkles aria-hidden='true' size={iconSizes.sm} />
					New
				</TooltipTrigger>
				<TooltipContent>Not reviewed yet</TooltipContent>
			</Tooltip>
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
