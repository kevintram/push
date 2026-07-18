import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { solidForegroundSpecimens } from './colorSolidForegrounds.data'

const styles = stylex.create({
	header: { marginBottom: spacing.lg },
	title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
	description: { color: colors.textSecondary, fontSize: fontSizes.sm },
	grid: {
		gap: spacing.sm,
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(2, minmax(0, 1fr))',
			'@media (min-width: 760px)': 'repeat(4, minmax(0, 1fr))',
		},
	},
	cell: {
		padding: spacing.md,
		borderRadius: radii.lg,
		alignItems: 'center',
		display: 'flex',
		minHeight: '76px',
	},
	paint: (fill: string, foreground: string) => ({
		backgroundColor: fill,
		color: foreground,
	}),
	icon: { fontSize: fontSizes.lg, marginInlineEnd: spacing.sm },
	label: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium },
})

export function ColorForegroundMatrix() {
	return (
		<section id='color-solid-foregrounds'>
			<header {...stylex.props(styles.header)}>
				<h3 {...stylex.props(styles.title)}>Solid foreground pairs</h3>
				<p {...stylex.props(styles.description)}>
					Text and current-color icons on every approved semantic
					solid fill.
				</p>
			</header>
			<div {...stylex.props(styles.grid)}>
				{solidForegroundSpecimens.map(specimen => (
					<div
						key={specimen.label}
						{...stylex.props(
							styles.cell,
							styles.paint(
								colors[specimen.fill] as string,
								colors[specimen.foreground] as string,
							),
						)}
					>
						<span aria-hidden {...stylex.props(styles.icon)}>
							◆
						</span>
						<span {...stylex.props(styles.label)}>
							{specimen.label}
						</span>
					</div>
				))}
			</div>
		</section>
	)
}
