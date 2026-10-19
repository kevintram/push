import * as stylex from '@stylexjs/stylex'
import { DayButton } from 'react-day-picker'

import { blue } from '~/styles/colors/primitives.stylex'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

const styles = stylex.create({
	button: {
		padding: spacing.none,
		borderColor: semanticColors.surfaceTransparent,
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			[DARK]: {
				default: null,
				':is([data-today="true"])': blue.s900,
			},
			default: semanticColors.surfaceTransparent,
			':is([data-selected-single="true"])':
				semanticColors.surfaceInteractivePrimary,
			':is([data-today="true"])': blue.s400,

			':is([data-selected-single="true"]):hover':
				semanticColors.surfaceInteractivePrimaryHover,
			':is([data-today="true"]):hover': blue.s600,
			':hover': semanticColors.surfaceTransparentHover,
		},
		blockSize: '32px',
		color: {
			default: semanticColors.textPrimary,
			':is([data-selected-single="true"])': semanticColors.textOnBrand,
			':is([data-today="true"])': semanticColors.textOnBrand,
		},
		cursor: 'pointer',
		fontSize: fontSizes.sm,
		inlineSize: '32px',
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
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
