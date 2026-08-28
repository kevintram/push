import * as stylex from '@stylexjs/stylex'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { reviewCardMetadataColors } from '~/styles/colors/components.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDateTone,
} from '~/utils/date'

import type { ReviewCardSrsState } from '../types/review.types'
import { getRating } from './reviewRatings'

const styles = stylex.create({
	container: {
		position: 'relative',
		zIndex: 1,

		gap: spacing.xl,
		alignItems: 'center',
		display: 'flex',
		flexGrow: 1,
		flexWrap: 'nowrap',

		overflow: 'hidden',

		fontSize: fontSizes.sm,
	},
	item: {
		gap: spacing.xs,
		alignItems: 'center',
		color: reviewCardMetadataColors.itemForeground,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
	overdue: {
		color: semanticColors.textDanger,
	},
})

/** Scheduling summary for a review card, including its recall estimate. */
export function ReviewCardMetadata({
	lastReviewedAt,
	lastRating,
	nextDueAt,
	retrievability,
	stability,
	today,
}: ReviewCardSrsState & { today: DateString }) {
	if (lastReviewedAt === null) {
		return (
			<div {...stylex.props(styles.container)}>
				<span {...stylex.props(styles.item)}>Unreviewed</span>
			</div>
		)
	}

	const isDueOverdue = getDateTone(nextDueAt, false, today) === 'overdue'
	const rating = getRating(lastRating ?? undefined)
	const RatingIcon = rating?.Icon
	const absoluteLastReviewedAt = formatAbsoluteDate(lastReviewedAt)
	const lastReviewedLabel = rating
		? `${rating.label}, reviewed ${absoluteLastReviewedAt}`
		: `Reviewed ${absoluteLastReviewedAt}`

	return (
		<div {...stylex.props(styles.container)}>
			{retrievability !== null ? (
				<span {...stylex.props(styles.item)}>
					{`${Math.round(retrievability * 100)}% recall`}
				</span>
			) : null}
			{nextDueAt !== null ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<span
								{...stylex.props(
									styles.item,
									isDueOverdue && styles.overdue,
								)}
							>
								{`Due ${formatRelativeDate(nextDueAt, today)}`}
							</span>
						}
					/>
					<TooltipContent>
						{formatAbsoluteDate(nextDueAt)}
					</TooltipContent>
				</Tooltip>
			) : null}
			<Tooltip>
				<TooltipTrigger
					render={
						<span
							aria-label={lastReviewedLabel}
							{...stylex.props(styles.item)}
						>
							{RatingIcon ? (
								<RatingIcon
									aria-hidden='true'
									size={iconSizes.md}
								/>
							) : null}
							{formatRelativeDate(lastReviewedAt, today)}
						</span>
					}
				/>
				<TooltipContent>
					{rating
						? `${rating.label} on ${absoluteLastReviewedAt}`
						: absoluteLastReviewedAt}
				</TooltipContent>
			</Tooltip>
			{stability !== null ? (
				<span {...stylex.props(styles.item)}>
					Durable for {Math.round(stability)}d
				</span>
			) : null}
		</div>
	)
}
