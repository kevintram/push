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
	getDateTone,
} from '~/utils/date'

import type { CardSrsState } from '../types/review.types'
import { formatDurability, formatRecall } from '../utils/cardSrs'
import { getLastReviewedDetails } from './reviewRatings'

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
		color: cardMetadataColors.itemForeground,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
	overdue: {
		color: semanticColors.textDanger,
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

	const isDueOverdue = getDateTone(nextDueAt, false, today) === 'overdue'
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
			{recall !== null ? (
				<span {...stylex.props(styles.item)}>{`${recall} recall`}</span>
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
				<TooltipContent>{lastReviewedTooltip}</TooltipContent>
			</Tooltip>
			{durability !== null ? (
				<span {...stylex.props(styles.item)}>
					Durable for {durability}
				</span>
			) : null}
		</div>
	)
}
