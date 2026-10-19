import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { semanticColors } from '~/styles/colors/semantic.stylex'
import { radii } from '~/styles/tokens.stylex'

import { type TabsVariant, TabsVariantContext } from './TabsContext'

export interface TabsListProps extends Omit<
	React.ComponentProps<typeof TabsPrimitive.List>,
	'className' | 'style'
> {
	variant?: TabsVariant
	xstyle?: stylex.StyleXStyles
}

const styles = stylex.create({
	base: {
		alignItems: 'center',
		display: 'inline-flex',
		flexDirection: {
			default: 'row',
			':is([data-orientation="vertical"])': 'column',
		},
		inlineSize: {
			default: 'fit-content',
			':is([data-orientation="vertical"])': 'auto',
		},
		justifyContent: 'center',
	},
	default: {
		borderRadius: radii.lg,
		backgroundColor: semanticColors.surfaceSecondary,
		color: semanticColors.textSecondary,
	},
	line: {
		borderBlockEndColor: {
			default: semanticColors.borderSubtle,
			':is([data-orientation="vertical"])':
				semanticColors.surfaceTransparent,
		},
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		borderInlineEndColor: {
			default: semanticColors.surfaceTransparent,
			':is([data-orientation="vertical"])': semanticColors.borderSubtle,
		},
		borderInlineEndStyle: 'solid',
		borderInlineEndWidth: '1px',
	},
})

const variantStyles: Record<TabsVariant, stylex.StyleXStyles> = {
	default: styles.default,
	line: styles.line,
}

export function TabsList({ variant = 'default', ...props }: TabsListProps) {
	return (
		<TabsVariantContext value={variant}>
			<TabsPrimitive.List
				{...stylex.props(
					styles.base,
					variantStyles[variant],
					props.xstyle,
				)}
				{...props}
			/>
		</TabsVariantContext>
	)
}
