import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
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

		borderColor: colorsSemantic.surfaceTransparent,
		borderStyle: 'solid',
		borderWidth: '1px',
		gap: spacing.sm,
		textDecoration: 'none',
		alignItems: 'center',
		backgroundColor: colorsSemantic.surfaceTransparent,
		color: {
			default: colorsSemantic.textInteractive,
			':is([data-active])': colorsSemantic.textInteractiveActive,
			':is([data-disabled])': colorsSemantic.textDisabled,
			':is([data-disabled]:hover)': colorsSemantic.textDisabled,
			':hover': colorsSemantic.textInteractiveHover,
			':active': colorsSemantic.textInteractiveActive,
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
			default: colorsSemantic.surfaceTransparent,
			':focus-visible': colorsSemantic.borderFocus,
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
			default: colorsSemantic.surfaceTransparent,
			':is([data-active])': colorsSemantic.surfaceTransparentHover,
		},
		boxShadow: {
			default: 'none',
			':is([data-active])': `0 1px 2px ${colorsSemantic.shadowPrimary}`,
		},
	},
	line: {
		borderRadius: 0,
		borderBlockEndColor: {
			default: colorsSemantic.surfaceTransparent,
			':is([data-active])': colorsSemantic.borderBrand,
			':is([data-orientation="vertical"])':
				colorsSemantic.surfaceTransparent,
		},
		borderInlineEndColor: {
			default: colorsSemantic.surfaceTransparent,
			':is([data-active][data-orientation="vertical"])':
				colorsSemantic.borderBrand,
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
