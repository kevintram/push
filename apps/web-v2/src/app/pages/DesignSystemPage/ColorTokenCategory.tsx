import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import type { ColorTokenCategory as ColorTokenCategoryData } from './colorSpecimens.types'

const styles = stylex.create({
	section: { scrollMarginTop: spacing.xl },
	header: { marginBottom: spacing.lg },
	titleRow: {
		gap: spacing.sm,
		alignItems: 'baseline',
		display: 'flex',
		flexWrap: 'wrap',
	},
	title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
	count: { color: colors.textSecondary, fontSize: fontSizes.xs },
	description: {
		color: colors.textSecondary,
		fontSize: fontSizes.sm,
		marginTop: spacing.xs,
	},
	grid: {
		gap: spacing.sm,
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			'@media (min-width: 760px)': 'repeat(2, minmax(0, 1fr))',
		},
	},
	card: {
		padding: spacing.md,
		borderColor: colors.border,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		gap: spacing.md,
		alignItems: 'center',
		backgroundColor: {
			default: colors.bgSurface,
			':hover': colors.bgSurfaceHover,
		},
		color: colors.text,
		cursor: 'copy',
		display: 'grid',
		gridTemplateColumns: '64px minmax(0, 1fr)',
		textAlign: 'left',
		width: '100%',
	},
	stage: {
		borderColor: colors.borderSecondary,
		borderRadius: radii.xs,
		borderStyle: 'solid',
		borderWidth: '1px',
		overflow: 'hidden',
		alignItems: 'center',
		backgroundColor: colors.bgSurfaceSecondary,
		display: 'flex',
		justifyContent: 'center',
		height: '48px',
		width: '64px',
	},
	background: (value: string) => ({ backgroundColor: value }),
	backgroundImage: (value: string) => ({
		backgroundColor: colors.bgFillBrand,
		backgroundImage: value,
	}),
	border: (value: string) => ({
		borderColor: value,
		borderStyle: 'solid',
		borderWidth: '4px',
	}),
	foreground: (value: string) => ({ color: value }),
	glyph: { fontSize: fontSizes.xl, fontWeight: fontWeights.bold },
	copy: { minWidth: 0 },
	name: {
		overflow: 'hidden',
		display: 'block',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	purpose: {
		overflow: 'hidden',
		color: colors.textSecondary,
		display: 'block',
		fontSize: fontSizes.xs,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		marginTop: spacing.xs,
	},
	mapping: {
		overflow: 'hidden',
		color: colors.textSecondary,
		display: 'block',
		fontSize: '0.6875rem',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		marginTop: spacing.xs,
	},
})

export function ColorTokenCategory({
	category,
}: {
	category: ColorTokenCategoryData
}) {
	return (
		<section id={category.id} {...stylex.props(styles.section)}>
			<header {...stylex.props(styles.header)}>
				<div {...stylex.props(styles.titleRow)}>
					<h3 {...stylex.props(styles.title)}>{category.title}</h3>
					<span {...stylex.props(styles.count)}>
						{category.tokens.length} roles
					</span>
				</div>
				<p {...stylex.props(styles.description)}>
					{category.description}
				</p>
			</header>
			<div {...stylex.props(styles.grid)}>
				{category.tokens.map(token => {
					const value = colors[token.name] as string
					return (
						<button
							key={token.name}
							type='button'
							data-color-token={token.name}
							data-color-token-group='colors'
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
									styles.stage,
									token.paint === 'background' &&
										styles.background(value),
									token.paint === 'backgroundImage' &&
										styles.backgroundImage(value),
									token.paint === 'border' &&
										styles.border(value),
									(token.paint === 'icon' ||
										token.paint === 'text') &&
										styles.foreground(value),
								)}
							>
								{token.paint === 'text' && (
									<span {...stylex.props(styles.glyph)}>
										Aa
									</span>
								)}
								{token.paint === 'icon' && (
									<span
										aria-hidden
										{...stylex.props(styles.glyph)}
									>
										◆
									</span>
								)}
							</span>
							<span {...stylex.props(styles.copy)}>
								<span {...stylex.props(styles.name)}>
									{token.name}
								</span>
								<span {...stylex.props(styles.purpose)}>
									{token.description}
								</span>
								<span {...stylex.props(styles.mapping)}>
									L {token.lightMapping} · D{' '}
									{token.darkMapping}
								</span>
							</span>
						</button>
					)
				})}
			</div>
		</section>
	)
}
