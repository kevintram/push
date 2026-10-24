import * as stylex from '@stylexjs/stylex'
import { Calendar, Sparkles } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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
import { getLastReviewedDetails } from './reviewRatings'
import { StrengthSignal } from './StrengthSignal'

const styles = stylex.create({
	boundary: {
		containerType: 'inline-size',
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,
	},
	clickable: {
		cursor: 'pointer',
	},
	container: {
		gap: {
			default: spacing.xl,
			'@container (max-width: 400px)': spacing.md,
		},
		alignItems: 'center',
		display: 'flex',
		flexWrap: 'nowrap',

		overflow: 'hidden',

		fontSize: fontSizes.sm,
	},
	item: {
		gap: spacing.xs,
		alignItems: 'center',
		color: colorsSemantic.textSecondary,
		display: 'inline-flex',
		fontWeight: fontWeights.semibold,
		whiteSpace: 'nowrap',
	},
	strength: {
		display: {
			default: 'inline-flex',
			'@container (max-width: 400px)': 'none',
		},
	},
	// Tooltip triggers must sit above the card's stretched-link overlay to
	// receive hover. Raise the individual triggers, not the whole row, so the
	// rest of the metadata stays click-through to the link.
	raisedItem: {
		position: 'relative',
		zIndex: 1,
	},
	overdue: {
		color: colorsSemantic.textDanger,
	},
	today: {
		color: colorsSemantic.textToday,
	},
})

/** Scheduling summary for a card, including its strength estimate. */
export function CardMetadata({
	lastReviewedAt,
	lastRating,
	nextDueAt,
	stability,
	today,
	onClick,
}: CardSrsState & {
	today: DateString
	/**
	 * Tooltip triggers are raised above CardItem's overlay button so they can
	 * receive hover events. Forward their clicks because they cannot reach that
	 * sibling overlay button directly.
	 *
	 * TODO(3): I feel like there should be a better way to do this but I don't feel
	 * like thinking right now.
	 */
	onClick?: React.MouseEventHandler<HTMLDivElement>
}) {
	if (lastReviewedAt === null) {
		return (
			<div
				onClick={onClick}
				{...stylex.props(styles.boundary, onClick && styles.clickable)}
			>
				<div {...stylex.props(styles.container)}>
					<Tooltip>
						<TooltipTrigger
							render={
								<span
									{...stylex.props(
										styles.item,
										styles.raisedItem,
									)}
								>
									<Sparkles
										aria-hidden='true'
										size={iconSizes.sm}
									/>
									New
								</span>
							}
						/>
						<TooltipContent>Not reviewed yet</TooltipContent>
					</Tooltip>
				</div>
			</div>
		)
	}

	const dueTone = getDueDateTone(nextDueAt, false, today)
	const {
		Icon: RatingIcon,
		ariaLabel: lastReviewedLabel,
		tooltip: lastReviewedTooltip,
	} = getLastReviewedDetails(lastReviewedAt, lastRating)

	return (
		<div
			onClick={onClick}
			{...stylex.props(styles.boundary, onClick && styles.clickable)}
		>
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
									<Calendar
										aria-hidden='true'
										size={iconSizes.sm}
									/>
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
										size={iconSizes.sm}
									/>
								) : null}
								{formatRelativeDate(lastReviewedAt, today)}
							</span>
						}
					/>
					<TooltipContent>{lastReviewedTooltip}</TooltipContent>
				</Tooltip>
				{stability !== null ? (
					<StrengthSignal
						stability={stability}
						xstyle={[
							styles.item,
							styles.raisedItem,
							styles.strength,
						]}
					/>
				) : null}
			</div>
		</div>
	)
}
