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

// A local string, not a shared constant: StyleX can leave an imported
// at-rule key unresolved in dev, emitting invalid CSS.
const wide = '@container (min-width: 560px)'

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
	// The table's column header already says "Due", so the icon and prefix
	// only show in the stacked layout.
	stackedOnly: {
		display: {
			default: null,
			[wide]: 'none',
		},
	},
	tableOnly: {
		display: {
			default: 'none',
			[wide]: 'inline',
		},
	},
})

type CardDueDateProps = {
	date: DateString | null
	today: DateString
}

/** When a card is next due, toned when due today or overdue. */
export function CardDueDate({ date, today }: CardDueDateProps) {
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
				<Calendar
					aria-hidden='true'
					size={iconSizes.sm}
					{...stylex.props(styles.stackedOnly)}
				/>
				<span {...stylex.props(styles.stackedOnly)}>
					Due {relativeDate}
				</span>
				<span {...stylex.props(styles.tableOnly)}>
					{relativeDate.charAt(0).toUpperCase() +
						relativeDate.slice(1)}
				</span>
			</TooltipTrigger>
			<TooltipContent>Due {formatAbsoluteDate(date)}</TooltipContent>
		</Tooltip>
	)
}
