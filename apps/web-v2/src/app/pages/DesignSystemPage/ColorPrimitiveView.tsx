import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import {
	baseColorSpecimens,
	primitiveScaleSpecimens,
	primitiveSteps,
} from './colorPrimitiveScales.data'

const styles = stylex.create({
	header: { marginBottom: spacing.lg },
	title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
	description: {
		color: colors.textSecondary,
		fontSize: fontSizes.sm,
		marginTop: spacing.xs,
	},
	baseGrid: {
		gap: spacing.sm,
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
		marginBottom: spacing.xl,
		maxWidth: '360px',
	},
	base: {
		padding: spacing.md,
		borderColor: colors.border,
		borderRadius: radii.xs,
		borderStyle: 'solid',
		borderWidth: '1px',
		alignItems: 'end',
		display: 'flex',
		height: '64px',
	},
	baseColor: (value: string) => ({ backgroundColor: value }),
	baseLabel: {
		borderRadius: radii.xs,
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,
		backgroundColor: colors.bgSurface,
		color: colors.text,
		fontSize: fontSizes.xs,
	},
	list: { gap: spacing.xl, display: 'flex', flexDirection: 'column' },
	scale: {
		padding: spacing.md,
		borderColor: colors.border,
		borderRadius: radii.lg,
		borderStyle: 'solid',
		borderWidth: '1px',
		backgroundColor: colors.bgSurface,
	},
	scaleHeader: {
		gap: spacing.sm,
		alignItems: 'baseline',
		display: 'flex',
		marginBottom: spacing.sm,
	},
	scaleName: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },
	variant: { color: colors.textSecondary, fontSize: fontSizes.xs },
	modeRow: {
		gap: spacing.sm,
		alignItems: 'center',
		display: 'grid',
		gridTemplateColumns: '40px minmax(620px, 1fr)',
		marginTop: spacing.xs,
		minWidth: '680px',
	},
	mode: {
		color: colors.textSecondary,
		fontSize: '0.625rem',
		fontWeight: fontWeights.medium,
		textTransform: 'uppercase',
	},
	swatches: {
		display: 'grid',
		gridTemplateColumns: 'repeat(12, minmax(40px, 1fr))',
	},
	swatch: {
		alignItems: 'end',
		display: 'flex',
		justifyContent: 'center',
		height: '40px',
	},
	swatchColor: (value: string) => ({ backgroundColor: value }),
	step: {
		color: colors.textInverse,
		fontSize: '0.5625rem',
		fontWeight: fontWeights.medium,
		textShadow: `0 1px 3px ${colors.shadowSubtle}`,
		paddingBottom: '2px',
	},
	overflow: { overflowX: 'auto' },
})

export function ColorPrimitiveView() {
	return (
		<section id='color-primitives'>
			<header {...stylex.props(styles.header)}>
				<h3 {...stylex.props(styles.title)}>Primitive scales</h3>
				<p {...stylex.props(styles.description)}>
					The Radix inputs used by the semantic layer, shown directly
					in both modes.
				</p>
			</header>
			<div {...stylex.props(styles.baseGrid)}>
				{baseColorSpecimens.map(specimen => (
					<div
						key={specimen.name}
						{...stylex.props(
							styles.base,
							styles.baseColor(specimen.value),
						)}
					>
						<span {...stylex.props(styles.baseLabel)}>
							{specimen.name}
						</span>
					</div>
				))}
			</div>
			<div {...stylex.props(styles.list)}>
				{primitiveScaleSpecimens.map(specimen => (
					<div
						key={`${specimen.name}-${specimen.variant}`}
						{...stylex.props(styles.scale)}
					>
						<div {...stylex.props(styles.scaleHeader)}>
							<strong {...stylex.props(styles.scaleName)}>
								{specimen.name}
							</strong>
							<span {...stylex.props(styles.variant)}>
								{specimen.variant}
							</span>
						</div>
						<div {...stylex.props(styles.overflow)}>
							{(
								[
									['Light', specimen.light],
									['Dark', specimen.dark],
								] as const
							).map(([mode, scale]) => (
								<div
									key={mode}
									{...stylex.props(styles.modeRow)}
								>
									<span {...stylex.props(styles.mode)}>
										{mode}
									</span>
									<div {...stylex.props(styles.swatches)}>
										{primitiveSteps.map((step, index) => (
											<span
												key={step}
												title={`${specimen.name} ${mode} ${step}`}
												{...stylex.props(
													styles.swatch,
													styles.swatchColor(
														scale[step],
													),
												)}
											>
												<span
													{...stylex.props(
														styles.step,
													)}
												>
													{index + 1}
												</span>
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
