import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { type TabsVariant, useTabsVariant } from './TabsContext'

export type TabsTriggerProps = Omit<
	React.ComponentProps<typeof TabsPrimitive.Tab>,
	'className' | 'style'
>

const styles = stylex.create({
	base: {
		paddingBlock: spacing.sm,
		paddingInline: spacing.md,

		borderColor: 'transparent',
		borderStyle: 'solid',
		borderWidth: '1px',
		gap: spacing.sm,
		alignItems: 'center',
		backgroundColor: colors.bgSurfaceTransparent,
		color: {
			default: colors.textInteractive,
			':is([data-active])': colors.textInteractiveActive,
			':is([data-disabled])': colors.textDisabled,
			':is([data-disabled]:hover)': colors.textDisabled,
			':hover': colors.textInteractiveHover,
			':active': colors.textInteractiveActive,
		},
		cursor: {
			default: 'pointer',
			':is([data-disabled])': 'default',
		},
		display: 'inline-flex',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		justifyContent: 'center',
		lineHeight: 1,
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		transitionDuration: '150ms',
		transitionProperty: 'background-color, border-color, color, box-shadow',
		transitionTimingFunction: 'ease-in-out',
		userSelect: 'none',
		whiteSpace: 'nowrap',
	},
	default: {
		borderRadius: radii.lg,
		backgroundColor: {
			default: colors.bgSurfaceTransparent,
			':is([data-active])': colors.bgFillTransparentSelected,
		},
		boxShadow: {
			default: 'none',
			':is([data-active])': `0 1px 2px ${colors.shadowSubtle}`,
		},
	},
	line: {
		borderRadius: 0,
		borderBlockEndColor: {
			default: 'transparent',
			':is([data-active])': colors.borderBrand,
			':is([data-orientation="vertical"])': 'transparent',
		},
		borderInlineEndColor: {
			default: 'transparent',
			':is([data-active][data-orientation="vertical"])':
				colors.borderBrand,
		},
		marginBlockEnd: {
			default: '-1px',
			':is([data-orientation="vertical"])': spacing.none,
		},
		marginInlineEnd: {
			default: spacing.none,
			':is([data-orientation="vertical"])': '-1px',
		},
	},
})

const variantStyles: Record<TabsVariant, stylex.StyleXStyles> = {
	default: styles.default,
	line: styles.line,
}

export function TabsTrigger(props: TabsTriggerProps) {
	const variant = useTabsVariant()

	return (
		<TabsPrimitive.Tab
			{...stylex.props(styles.base, variantStyles[variant])}
			{...props}
		/>
	)
}
