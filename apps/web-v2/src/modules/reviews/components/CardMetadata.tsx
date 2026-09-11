import * as stylex from '@stylexjs/stylex'
import { Anvil } from 'lucide-react'

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
import { formatDurability, formatDurabilityTooltip } from '../utils/cardSrs'
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

/** Scheduling summary for a card, including its durability estimate. */
export function CardMetadata({
	lastReviewedAt,
	lastRating,
	nextDueAt,
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
	const durability = formatDurability(stability)
	const durabilityTooltip = formatDurabilityTooltip(stability)
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
			{durability !== null ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<span
								{...stylex.props(
									styles.item,
									styles.raisedItem,
								)}
							>
								Durability
								<Anvil aria-hidden='true' size={iconSizes.md} />
								{durability}
							</span>
						}
					/>
					<TooltipContent>{durabilityTooltip}</TooltipContent>
				</Tooltip>
			) : null}
		</div>
	)
}
