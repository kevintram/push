import * as stylex from '@stylexjs/stylex'
import { DayButton } from 'react-day-picker'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	button: {
		padding: spacing.none,
		borderColor: 'transparent',
		borderRadius: radii.full,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':is([data-selected-single="true"])': colors.bgFillBrand,
			':is([data-today="true"])': colors.bgSurfaceInfo,

			':is([data-selected-single="true"]):hover': colors.bgFillBrandHover,
			':is([data-today="true"]):hover': colors.bgSurfaceInfoHover,
			':hover': colors.bgFillTransparentHover,
		},
		blockSize: '32px',
		color: {
			default: colors.text,
			':is([data-selected-single="true"])': colors.textBrandOnBgFill,
		},
		cursor: 'pointer',
		fontSize: fontSizes.sm,
		inlineSize: '32px',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
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
