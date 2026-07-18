import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { effectTokens } from './colorCatalog.generated'

const styles = stylex.create({
	header: { marginBottom: spacing.lg },
	title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
	description: { color: colors.textSecondary, fontSize: fontSizes.sm },
	grid: {
		gap: spacing.md,
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			'@media (min-width: 700px)': 'repeat(3, minmax(0, 1fr))',
		},
	},
	card: {
		padding: spacing.lg,
		borderColor: colors.border,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: colors.bgSurface,
		color: colors.text,
		cursor: 'copy',
		textAlign: 'left',
	},
	swatch: {
		borderColor: colors.borderSecondary,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: colors.bgSurface,
		height: '64px',
		marginBottom: spacing.lg,
	},
	shadow: (value: string) => ({ boxShadow: `0 12px 28px ${value}` }),
	inset: (value: string) => ({ boxShadow: `inset 0 0 0 4px ${value}` }),
	name: { fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
	detail: {
		color: colors.textSecondary,
		fontSize: fontSizes.xs,
		marginTop: spacing.xs,
	},
})

export function ColorEffectsView() {
	return (
		<section id='color-effects'>
			<header {...stylex.props(styles.header)}>
				<h3 {...stylex.props(styles.title)}>Effects</h3>
				<p {...stylex.props(styles.description)}>
					Three local shadow and edge colors intentionally absent from
					Polaris.
				</p>
			</header>
			<div {...stylex.props(styles.grid)}>
				{effectTokens.map(token => {
					const value = colors[token.name] as string
					return (
						<button
							key={token.name}
							type='button'
							data-color-token={token.name}
							data-color-token-group='effects'
							title={`Copy colors.${token.name}`}
							onClick={() =>
								navigator.clipboard?.writeText(
									`colors.${token.name}`,
								)
							}
							{...stylex.props(styles.card)}
						>
							<span
								data-token-swatch
								{...stylex.props(
									styles.swatch,
									token.paint === 'shadow'
										? styles.shadow(value)
										: styles.inset(value),
								)}
							/>
							<span {...stylex.props(styles.name)}>
								{token.name}
							</span>
							<span {...stylex.props(styles.detail)}>
								L {token.lightMapping} · D {token.darkMapping}
							</span>
						</button>
					)
				})}
			</div>
		</section>
	)
}
