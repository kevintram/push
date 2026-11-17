import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { a11y } from '~/styles/a11y'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import type { DateString } from '~/types/date'
import { formatAbsoluteDate, formatRelativeDate } from '~/utils/date'

const styles = stylex.create({
	date: {
		color: colorsSemantic.textSecondary,
		whiteSpace: 'nowrap',
	},
	today: { color: colorsSemantic.textToday },
})

type ReviewDateProps = {
	date: DateString
	xstyle?: StyleXStyles
}

/**
 * A review's date as read-only text, toned like `ReviewDatePicker`, with the
 * full date on hover.
 */
export function ReviewDate({ date, xstyle }: ReviewDateProps) {
	const today = useToday()
	const relativeDate = formatRelativeDate(date, today)
	const absoluteDate = formatAbsoluteDate(date)

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						{...stylex.props(
							styles.date,
							date === today && styles.today,
							xstyle,
						)}
					/>
				}
			>
				<time dateTime={date}>{relativeDate}</time>
				{/* The tooltip is hover-only, so screen readers get the full date here. */}
				{relativeDate !== absoluteDate && (
					<span {...stylex.props(a11y.visuallyHidden)}>
						, {absoluteDate}
					</span>
				)}
			</TooltipTrigger>
			<TooltipContent>Completed {absoluteDate}</TooltipContent>
		</Tooltip>
	)
}
