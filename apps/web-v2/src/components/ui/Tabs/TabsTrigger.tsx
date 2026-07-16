import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import {
	colors,
	fontSizes,
	fontWeights,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

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
		backgroundColor: 'transparent',
		color: {
			default: colors.mutedForeground,
			':is([data-active])': colors.foreground,
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
		opacity: {
			default: 1,
			':is([data-disabled])': 0.5,
		},
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.focusRing,
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
		borderRadius: radii.sm,
		backgroundColor: {
			default: 'transparent',
			':is([data-active])': colors.surface,
		},
		boxShadow: {
			default: 'none',
			':is([data-active])': '0 1px 2px rgb(0 0 0 / 0.08)',
		},
	},
	line: {
		borderRadius: 0,
		borderBlockEndColor: {
			default: 'transparent',
			':is([data-active])': colors.foreground,
			':is([data-orientation="vertical"])': 'transparent',
		},
		borderInlineEndColor: {
			default: 'transparent',
			':is([data-active][data-orientation="vertical"])':
				colors.foreground,
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
