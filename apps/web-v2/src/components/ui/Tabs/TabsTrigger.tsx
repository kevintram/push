import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { tabsColors } from '~/styles/colors/components.stylex'
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

		borderColor: tabsColors.triggerBorder,
		borderStyle: 'solid',
		borderWidth: '1px',
		gap: spacing.sm,
		alignItems: 'center',
		backgroundColor: tabsColors.triggerBackground,
		color: {
			default: tabsColors.triggerForeground,
			':is([data-active])': tabsColors.triggerForegroundSelected,
			':is([data-disabled])': tabsColors.triggerForegroundDisabled,
			':is([data-disabled]:hover)': tabsColors.triggerForegroundDisabled,
			':hover': tabsColors.triggerForegroundHover,
			':active': tabsColors.triggerForegroundPressed,
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
			default: tabsColors.triggerFocusRingRest,
			':focus-visible': tabsColors.triggerFocusRing,
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
			default: tabsColors.defaultTriggerBackground,
			':is([data-active])': tabsColors.defaultTriggerBackgroundSelected,
		},
		boxShadow: {
			default: 'none',
			':is([data-active])': `0 1px 2px ${tabsColors.defaultTriggerShadowSelected}`,
		},
	},
	line: {
		borderRadius: 0,
		borderBlockEndColor: {
			default: tabsColors.lineTriggerBorderRest,
			':is([data-active])': tabsColors.lineTriggerBorderSelected,
			':is([data-orientation="vertical"])':
				tabsColors.lineTriggerBorderRest,
		},
		borderInlineEndColor: {
			default: tabsColors.lineTriggerBorderRest,
			':is([data-active][data-orientation="vertical"])':
				tabsColors.lineTriggerBorderSelected,
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
