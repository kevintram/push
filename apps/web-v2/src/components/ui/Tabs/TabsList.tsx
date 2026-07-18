import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { radii, spacing } from '~/styles/tokens.stylex'

import { type TabsVariant, TabsVariantContext } from './TabsContext'

export interface TabsListProps extends Omit<
	React.ComponentProps<typeof TabsPrimitive.List>,
	'className' | 'style'
> {
	variant?: TabsVariant
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
		padding: spacing.xs,

		borderRadius: radii.lg,
		backgroundColor: colors.bgSurfaceSecondary,
		color: colors.textSecondary,
	},
	line: {
		borderBlockEndColor: {
			default: colors.borderSecondary,
			':is([data-orientation="vertical"])': 'transparent',
		},
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		borderInlineEndColor: {
			default: 'transparent',
			':is([data-orientation="vertical"])': colors.borderSecondary,
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
				{...stylex.props(styles.base, variantStyles[variant])}
				{...props}
			/>
		</TabsVariantContext>
	)
}
