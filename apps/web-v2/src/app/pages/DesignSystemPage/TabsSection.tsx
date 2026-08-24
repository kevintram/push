import * as stylex from '@stylexjs/stylex'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui'
import { neutral } from '~/styles/colors/primitives.stylex'
import { breakpoints, fontSizes, spacing } from '~/styles/tokens.stylex'

const DARK = '@media (prefers-color-scheme: dark)'

import { SpecimenSection } from './SpecimenSection'

const tabVariants = ['default', 'line'] as const

const styles = stylex.create({
	grid: {
		columnGap: spacing['2xl'],
		rowGap: spacing.xl,

		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			[breakpoints.tablet]: 'repeat(2, minmax(0, 1fr))',
		},
	},
	example: {
		minWidth: 0,
	},
	label: {
		marginBottom: spacing.md,

		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,
	},
	panel: {
		paddingBlock: spacing.lg,

		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.sm,
		lineHeight: 1.5,
	},
})

export function TabsSection() {
	return (
		<SpecimenSection
			id='tabs'
			title='Tabs'
			meta={`${tabVariants.length} variants · compound API`}
		>
			<div {...stylex.props(styles.grid)}>
				{tabVariants.map(variant => (
					<div key={variant} {...stylex.props(styles.example)}>
						<div {...stylex.props(styles.label)}>{variant}</div>
						<Tabs defaultValue='overview'>
							<TabsList variant={variant}>
								<TabsTrigger value='overview'>
									Overview
								</TabsTrigger>
								<TabsTrigger value='activity'>
									Activity
								</TabsTrigger>
								<TabsTrigger value='disabled' disabled>
									Disabled
								</TabsTrigger>
							</TabsList>
							<TabsContent value='overview'>
								<p {...stylex.props(styles.panel)}>
									A concise summary of the current workspace.
								</p>
							</TabsContent>
							<TabsContent value='activity'>
								<p {...stylex.props(styles.panel)}>
									Recent changes and study activity appear
									here.
								</p>
							</TabsContent>
							<TabsContent value='disabled'>
								<p {...stylex.props(styles.panel)}>
									Unavailable content.
								</p>
							</TabsContent>
						</Tabs>
					</div>
				))}
			</div>
		</SpecimenSection>
	)
}
