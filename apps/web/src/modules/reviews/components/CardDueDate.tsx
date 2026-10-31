import * as stylex from '@stylexjs/stylex'
import { Archive, Calendar } from 'lucide-react'

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
	muted: {
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
	/** A retired card is never due, so it says so in place of a date. */
	retired?: boolean
}

/** When a card is next due, toned when due today or overdue. */
export function CardDueDate({
	date,
	today,
	variant,
	retired = false,
}: CardDueDateProps) {
	if (retired) {
		return (
			<span {...stylex.props(styles.date, styles.muted)}>
				{variant === 'details' ? (
					<Archive aria-hidden='true' size={iconSizes.sm} />
				) : null}
				Retired
			</span>
		)
	}

	if (date === null) {
		return <span {...stylex.props(styles.date, styles.muted)}>—</span>
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
