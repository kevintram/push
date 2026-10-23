import * as stylex from '@stylexjs/stylex'
import { DayButton } from 'react-day-picker'

import { blue } from '~/styles/colors/colorsPrimitive.stylex'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

const styles = stylex.create({
	button: {
		padding: spacing.none,
		borderColor: colorsSemantic.surfaceTransparent,
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			[DARK]: {
				default: null,
				':is([data-today="true"])': blue.s900,
			},
			default: colorsSemantic.surfaceTransparent,
			':is([data-selected-single="true"])':
				colorsSemantic.surfaceInteractivePrimary,
			':is([data-today="true"])': blue.s400,

			':is([data-selected-single="true"]):hover':
				colorsSemantic.surfaceInteractivePrimaryHover,
			':is([data-today="true"]):hover': blue.s600,
			':hover': colorsSemantic.surfaceTransparentHover,
		},
		blockSize: '32px',
		color: {
			default: colorsSemantic.textPrimary,
			':is([data-selected-single="true"])': colorsSemantic.textOnBrand,
			':is([data-today="true"])': colorsSemantic.textOnBrand,
		},
		cursor: 'pointer',
		fontSize: fontSizes.sm,
		inlineSize: '32px',
		outlineColor: {
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
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
