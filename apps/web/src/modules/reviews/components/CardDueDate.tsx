import * as stylex from '@stylexjs/stylex'
import { Calendar } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui'
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
		display: 'inline-flex',
		whiteSpace: 'nowrap',

		color: colorsSemantic.textSecondary,
	},
	empty: {
		color: colorsSemantic.textTertiary,
	},
	today: { color: colorsSemantic.textToday },
	overdue: { color: colorsSemantic.textDanger },
})

type CardDueDateProps = {
	date: DateString | null
	today: DateString
	/**
	 * The table's column header already says "Due", so only the details line
	 * under a stacked title shows the icon and prefix.
	 */
	variant: 'column' | 'details'
}

/** When a card is next due, toned when due today or overdue. */
export function CardDueDate({ date, today, variant }: CardDueDateProps) {
	if (date === null) {
		return <span {...stylex.props(styles.date, styles.empty)}>—</span>
	}

	const tone = getDueDateTone(date, false, today)
	const relativeDate = formatRelativeDate(date, today)

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<span
						{...stylex.props(
							styles.date,
							tone === 'today' && styles.today,
							tone === 'overdue' && styles.overdue,
						)}
					/>
				}
			>
				{variant === 'details' ? (
					<>
						<Calendar aria-hidden='true' size={iconSizes.sm} />
						Due {relativeDate}
					</>
				) : (
					relativeDate.charAt(0).toUpperCase() + relativeDate.slice(1)
				)}
			</TooltipTrigger>
			<TooltipContent>Due {formatAbsoluteDate(date)}</TooltipContent>
		</Tooltip>
	)
}
