import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { CalendarIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
// StyleX's dev server only resolves shared constants through the `~` alias.
import { reviewTable } from '~/modules/reviews/components/reviewTable.stylex'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import {
	formatAbsoluteDate,
	formatRelativeDate,
	getDueDateTone,
} from '~/utils/date'

const styles = stylex.create({
	date: {
		alignItems: 'center',
		columnGap: spacing.xs,
		display: 'flex',

		color: colorsSemantic.textSecondary,
		whiteSpace: 'nowrap',
	},
	today: { color: colorsSemantic.textToday },
	overdue: { color: colorsSemantic.textDanger },
	// The table's Date column header already names it.
	icon: {
		display: {
			default: null,
			[reviewTable.wide]: 'none',
		},
		flexShrink: 0,
	},
})

type ReviewDateProps = {
	date: DateString
	isCompleted: boolean
	xstyle?: StyleXStyles
}

/**
 * A review's date as read-only text, toned like `ReviewDatePicker`, with the
 * full date on hover.
 */
export function ReviewDate({ date, isCompleted, xstyle }: ReviewDateProps) {
	const today = useToday()
	const tone = getDueDateTone(date, isCompleted, today)
	const relativeDate = formatRelativeDate(date, today)
	const absoluteDate = formatAbsoluteDate(date)

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						{...stylex.props(
							styles.date,
							tone === 'today' && styles.today,
							tone === 'overdue' && styles.overdue,
							xstyle,
						)}
					/>
				}
			>
				<CalendarIcon
					aria-hidden='true'
					size={iconSizes.sm}
					{...stylex.props(styles.icon)}
				/>
				<time dateTime={date}>{relativeDate}</time>
				{/* The tooltip is hover-only, so screen readers get the full date here. */}
				{relativeDate !== absoluteDate && (
					<span {...stylex.props(a11y.visuallyHidden)}>
						, {absoluteDate}
					</span>
				)}
			</TooltipTrigger>
			<TooltipContent>
				{isCompleted ? 'Completed' : 'Due'} {absoluteDate}
			</TooltipContent>
		</Tooltip>
	)
}
