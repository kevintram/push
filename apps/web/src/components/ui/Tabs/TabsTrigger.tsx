import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
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

		borderColor: semanticColors.surfaceTransparent,
		borderStyle: 'solid',
		borderWidth: '1px',
		gap: spacing.sm,
		textDecoration: 'none',
		alignItems: 'center',
		backgroundColor: semanticColors.surfaceTransparent,
		color: {
			default: semanticColors.textInteractive,
			':is([data-active])': semanticColors.textInteractiveActive,
			':is([data-disabled])': semanticColors.textDisabled,
			':is([data-disabled]:hover)': semanticColors.textDisabled,
			':hover': semanticColors.textInteractiveHover,
			':active': semanticColors.textInteractiveActive,
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
			default: semanticColors.surfaceTransparent,
			':focus-visible': semanticColors.borderFocus,
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
			default: semanticColors.surfaceTransparent,
			':is([data-active])': semanticColors.surfaceTransparentHover,
		},
		boxShadow: {
			default: 'none',
			':is([data-active])': `0 1px 2px ${semanticColors.shadowPrimary}`,
		},
	},
	line: {
		borderRadius: 0,
		borderBlockEndColor: {
			default: semanticColors.surfaceTransparent,
			':is([data-active])': semanticColors.borderBrand,
			':is([data-orientation="vertical"])':
				semanticColors.surfaceTransparent,
		},
		borderInlineEndColor: {
			default: semanticColors.surfaceTransparent,
			':is([data-active][data-orientation="vertical"])':
				semanticColors.borderBrand,
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
