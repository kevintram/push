import * as stylex from '@stylexjs/stylex'

import { SidebarPanel } from '~/components/SidebarPanel'
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

import type { CardSrsState } from '../../types/review.types'
import { getLastReviewedDetails } from '../reviewRatings'
import { StrengthSignal } from '../StrengthSignal'

const styles = stylex.create({
	container: {
		flexShrink: 0,
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
		color: colorsSemantic.textSecondary,
		fontWeight: fontWeights.medium,
	},
	value: {
		// Shrink the cell to its text so tooltips anchor to the value rather
		// than to the full width of the 1fr column.
		justifySelf: 'start',

		color: colorsSemantic.textPrimary,
		whiteSpace: 'nowrap',
	},
	valueWithIcon: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'inline-flex',
	},
	overdue: {
		color: colorsSemantic.textDanger,
	},
	today: {
		color: colorsSemantic.textToday,
	},
})

type CardPropertiesPanelProps = CardSrsState & {
	today: DateString
}

export function CardPropertiesPanel({
	lastReviewedAt,
	lastRating,
	nextDueAt,
	stability,
	today,
}: CardPropertiesPanelProps) {
	const dueTone = getDueDateTone(nextDueAt, false, today)
	const lastReviewed =
		lastReviewedAt === null
			? null
			: getLastReviewedDetails(lastReviewedAt, lastRating)

	return (
		<SidebarPanel title='Properties' xstyle={styles.container}>
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
											dueTone === 'overdue' &&
												styles.overdue,
											dueTone === 'today' && styles.today,
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
					<span {...stylex.props(styles.label)}>Last reviewed</span>
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
											lastReviewedAt === today &&
												styles.today,
										)}
									>
										{lastReviewed.Icon ? (
											<lastReviewed.Icon
												aria-hidden='true'
												size={iconSizes.sm}
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
					<span {...stylex.props(styles.label)}>Strength</span>
					<StrengthSignal
						hasVisibleLabel
						stability={stability}
						xstyle={styles.value}
					/>
				</div>
			</div>
		</SidebarPanel>
	)
}
