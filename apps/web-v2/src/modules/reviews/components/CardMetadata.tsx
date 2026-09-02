import * as stylex from '@stylexjs/stylex'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { cardMetadataColors } from '~/styles/colors/components.stylex'
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
	getDueDateTone,
} from '~/utils/date'

import type { CardSrsState } from '../types/review.types'
import { formatDurability, formatRecall } from '../utils/cardSrs'
import { getLastReviewedDetails } from './reviewRatings'

const styles = stylex.create({
	container: {
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
		color: cardMetadataColors.itemForeground,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
	// Tooltip triggers must sit above the card's stretched-link overlay to
	// receive hover. Raise the individual triggers, not the whole row, so the
	// rest of the metadata stays click-through to the link.
	raisedItem: {
		position: 'relative',
		zIndex: 1,
	},
	overdue: {
		color: semanticColors.textDanger,
	},
	today: {
		color: cardMetadataColors.itemForegroundToday,
	},
})

/** Scheduling summary for a card, including its recall estimate. */
export function CardMetadata({
	lastReviewedAt,
	lastRating,
	nextDueAt,
	retrievability,
	stability,
	today,
}: CardSrsState & { today: DateString }) {
	if (lastReviewedAt === null) {
		return (
			<div {...stylex.props(styles.container)}>
				<span {...stylex.props(styles.item)}>Unreviewed</span>
			</div>
		)
	}

	const dueTone = getDueDateTone(nextDueAt, false, today)
	const recall = formatRecall(retrievability)
	const durability = formatDurability(stability)
	const {
		Icon: RatingIcon,
		ariaLabel: lastReviewedLabel,
		tooltip: lastReviewedTooltip,
	} = getLastReviewedDetails(lastReviewedAt, lastRating)

	return (
		<div {...stylex.props(styles.container)}>
			{nextDueAt !== null ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<span
								{...stylex.props(
									styles.item,
									styles.raisedItem,
									dueTone === 'overdue' && styles.overdue,
									dueTone === 'today' && styles.today,
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
							{...stylex.props(
								styles.item,
								styles.raisedItem,
								lastReviewedAt === today && styles.today,
							)}
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
				<TooltipContent>{lastReviewedTooltip}</TooltipContent>
			</Tooltip>
			{recall !== null ? (
				<span {...stylex.props(styles.item)}>{`${recall} recall`}</span>
			) : null}
			{durability !== null ? (
				<span {...stylex.props(styles.item)}>
					Durable for {durability}
				</span>
			) : null}
		</div>
	)
}
