import * as stylex from '@stylexjs/stylex'
import { DayButton } from 'react-day-picker'

import { calendarColors } from '~/styles/colors/components.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	button: {
		padding: spacing.none,
		borderColor: calendarColors.dayButtonBorder,
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: calendarColors.dayButtonBackground,
			':is([data-selected-single="true"])':
				calendarColors.dayButtonBackgroundSelected,
			':is([data-today="true"])': calendarColors.dayButtonBackgroundToday,

			':is([data-selected-single="true"]):hover':
				calendarColors.dayButtonBackgroundSelectedHover,
			':is([data-today="true"]):hover':
				calendarColors.dayButtonBackgroundTodayHover,
			':hover': calendarColors.dayButtonBackgroundHover,
		},
		blockSize: '32px',
		color: {
			default: calendarColors.dayButtonForeground,
			':is([data-selected-single="true"])':
				calendarColors.dayButtonForegroundSelected,
		},
		cursor: 'pointer',
		fontSize: fontSizes.sm,
		inlineSize: '32px',
		outlineColor: {
			default: calendarColors.dayButtonFocusRingRest,
			':focus-visible': calendarColors.dayButtonFocusRing,
		},
		outlineOffset: '1px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
})

export function CalendarDayButton({
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	return (
		<DayButton
			day={day}
			data-selected-single={modifiers.selected || undefined}
			data-today={modifiers.today || undefined}
			modifiers={modifiers}
			{...props}
			{...stylex.props(styles.button)}
		/>
	)
}
