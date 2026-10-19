import * as stylex from '@stylexjs/stylex'
import { DayPicker } from 'react-day-picker'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { CalendarChevron } from './CalendarChevron'
import { CalendarDayButton } from './CalendarDayButton'

const styles = stylex.create({
	root: { padding: spacing.md, inlineSize: 'fit-content' },
	months: { display: 'flex', position: 'relative' },
	month: { display: 'flex', flexDirection: 'column', rowGap: spacing.md },
	monthCaption: {
		alignItems: 'center',
		blockSize: '32px',
		display: 'flex',
		justifyContent: 'center',
	},
	captionLabel: {
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
	},
	nav: {
		insetInline: 0,
		alignItems: 'center',
		display: 'flex',
		insetBlockStart: 0,
		justifyContent: 'space-between',
		position: 'absolute',
	},
	navButton: {
		padding: spacing.none,
		borderColor: semanticColors.surfaceTransparent,
		borderRadius: radii.sm,
		borderStyle: 'solid',
		borderWidth: '1px',
		alignItems: 'center',
		backgroundColor: {
			default: semanticColors.surfaceTransparent,
			':hover': semanticColors.surfaceTransparentHover,
			':active': semanticColors.surfaceTransparentActive,
		},
		blockSize: '32px',
		color: semanticColors.textInteractive,
		cursor: 'pointer',
		display: 'inline-flex',
		inlineSize: '32px',
		justifyContent: 'center',
		outlineColor: {
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	monthGrid: { borderCollapse: 'collapse' },
	weekdays: { display: 'flex' },
	weekday: {
		color: semanticColors.textSecondary,
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.regular,
		inlineSize: '32px',
		textAlign: 'center',
		userSelect: 'none',
	},
	week: { display: 'flex', marginBlockStart: spacing.xs },
	day: {
		blockSize: '32px',
		inlineSize: '32px',
		textAlign: 'center',
	},
	outside: { opacity: 0.45 },
	disabled: { opacity: 0.35, pointerEvents: 'none' },
	hidden: { visibility: 'hidden' },
})

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
	components,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			classNames={{
				root: stylex.props(styles.root).className,
				months: stylex.props(styles.months).className,
				month: stylex.props(styles.month).className,
				month_caption: stylex.props(styles.monthCaption).className,
				caption_label: stylex.props(styles.captionLabel).className,
				nav: stylex.props(styles.nav).className,
				button_previous: stylex.props(styles.navButton).className,
				button_next: stylex.props(styles.navButton).className,
				month_grid: stylex.props(styles.monthGrid).className,
				weekdays: stylex.props(styles.weekdays).className,
				weekday: stylex.props(styles.weekday).className,
				week: stylex.props(styles.week).className,
				day: stylex.props(styles.day).className,
				outside: stylex.props(styles.outside).className,
				disabled: stylex.props(styles.disabled).className,
				hidden: stylex.props(styles.hidden).className,
			}}
			components={{
				Chevron: CalendarChevron,
				DayButton: CalendarDayButton,
				...components,
			}}
			showOutsideDays={showOutsideDays}
			{...props}
		/>
	)
}
