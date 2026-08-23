import * as stylex from '@stylexjs/stylex'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui'
import { grayDark, grayLight } from '~/styles/colorPrimitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, spacing } from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const tabVariants = ['default', 'line'] as const

const styles = stylex.create({
	grid: {
		columnGap: spacing['2xl'],
		rowGap: spacing.xl,

		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			'@media (min-width: 768px)': 'repeat(2, minmax(0, 1fr))',
		},
	},
	example: {
		minWidth: 0,
	},
	label: {
		marginBottom: spacing.md,

		color: { [DARK]: grayDark.s11, default: grayLight.s11 },
		fontSize: fontSizes.xs,
	},
	panel: {
		paddingBlock: spacing.lg,

		color: { [DARK]: grayDark.s11, default: grayLight.s11 },
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
