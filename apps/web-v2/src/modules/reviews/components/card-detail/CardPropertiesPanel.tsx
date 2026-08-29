import * as stylex from '@stylexjs/stylex'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { cardPropertiesColors } from '~/styles/colors/components.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDateTone,
} from '~/utils/date'

import type { CardSrsState } from '../../types/review.types'
import { formatDurability, formatRecall } from '../../utils/cardSrs'
import { getLastReviewedDetails } from '../reviewRatings'

const styles = stylex.create({
	container: {
		padding: spacing.lg,
		borderRadius: radii.xl,
		backgroundColor: cardPropertiesColors.containerBackground,
		flexShrink: 0,
	},
	title: {
		margin: 0,

		color: semanticColors.textSecondary,
		fontSize: fontSizes.md,
		fontWeight: fontWeights.medium,
		paddingBlockEnd: spacing.sm,
	},
	list: {
		columnGap: spacing['3xl'],
		rowGap: spacing.sm,

		display: 'grid',
		gridTemplateColumns: 'auto minmax(0, 1fr)',

		fontSize: fontSizes.sm,
	},
	row: {
		display: 'contents',
	},
	label: {
		color: cardPropertiesColors.labelForeground,
		fontWeight: fontWeights.medium,
	},
	value: {
		// Shrink the cell to its text so tooltips anchor to the value rather
		// than to the full width of the 1fr column.
		justifySelf: 'start',

		color: cardPropertiesColors.valueForeground,
		whiteSpace: 'nowrap',
	},
	valueWithIcon: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'inline-flex',
	},
	overdue: {
		color: semanticColors.textDanger,
	},
})

type CardPropertiesPanelProps = CardSrsState & {
	today: DateString
}

export function CardPropertiesPanel({
	lastReviewedAt,
	lastRating,
	nextDueAt,
	retrievability,
	stability,
	today,
}: CardPropertiesPanelProps) {
	const isDueOverdue = getDateTone(nextDueAt, false, today) === 'overdue'
	const lastReviewed =
		lastReviewedAt === null
			? null
			: getLastReviewedDetails(lastReviewedAt, lastRating)

	return (
		<section aria-label='Properties' {...stylex.props(styles.container)}>
			<p {...stylex.props(styles.title)}>Properties</p>
			<div {...stylex.props(styles.list)}>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Due</span>
					{nextDueAt === null ? (
						<span {...stylex.props(styles.value)}>Unscheduled</span>
					) : (
						<Tooltip>
							<TooltipTrigger
								render={
									<span
										{...stylex.props(
											styles.value,
											isDueOverdue && styles.overdue,
										)}
									>
										{formatRelativeDate(nextDueAt, today)}
									</span>
								}
							/>
							<TooltipContent>
								{formatAbsoluteDate(nextDueAt)}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Recall</span>
					<span {...stylex.props(styles.value)}>
						{formatRecall(retrievability) ?? '—'}
					</span>
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Reviewed</span>
					{lastReviewedAt === null || lastReviewed === null ? (
						<span {...stylex.props(styles.value)}>—</span>
					) : (
						<Tooltip>
							<TooltipTrigger
								render={
									<span
										aria-label={lastReviewed.ariaLabel}
										{...stylex.props(
											styles.value,
											styles.valueWithIcon,
										)}
									>
										{lastReviewed.Icon ? (
											<lastReviewed.Icon
												aria-hidden='true'
												size={iconSizes.md}
											/>
										) : null}
										{formatRelativeDate(
											lastReviewedAt,
											today,
										)}
									</span>
								}
							/>
							<TooltipContent>
								{lastReviewed.tooltip}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
				<div {...stylex.props(styles.row)}>
					<span {...stylex.props(styles.label)}>Durability</span>
					<span {...stylex.props(styles.value)}>
						{formatDurability(stability) ?? '—'}
					</span>
				</div>
			</div>
		</section>
	)
}
