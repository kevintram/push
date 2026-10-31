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
}: CardSrsState & { today: DateString }) {
	if (lastReviewedAt === null) {
		return (
			<div {...stylex.props(styles.boundary)}>
				<div {...stylex.props(styles.container)}>
					<Tooltip>
						<TooltipTrigger
							render={
								<span {...stylex.props(styles.item)}>
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
		<div {...stylex.props(styles.boundary)}>
			<div {...stylex.props(styles.container)}>
				{nextDueAt !== null ? (
					<Tooltip>
						<TooltipTrigger
							render={
								<span
									{...stylex.props(
										styles.item,
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
						xstyle={[styles.item, styles.strength]}
					/>
				) : null}
			</div>
		</div>
	)
}
