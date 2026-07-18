import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'

import { colorStateRows, colorStates } from './colorStateMatrix.data'

const styles = stylex.create({
	header: { marginBottom: spacing.lg },
	title: { fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
	description: { color: colors.textSecondary, fontSize: fontSizes.sm },
	overflow: { overflowX: 'auto' },
	matrix: {
		gap: spacing.xs,
		display: 'grid',
		gridTemplateColumns: '120px repeat(8, minmax(104px, 1fr))',
		minWidth: '1040px',
	},
	label: {
		alignItems: 'center',
		color: colors.textSecondary,
		display: 'flex',
		fontSize: fontSizes.xs,
		fontWeight: fontWeights.medium,
	},
	cell: {
		padding: spacing.sm,
		borderRadius: radii.lg,
		alignItems: 'center',
		backgroundColor: colors.bgSurfaceSecondary,
		display: 'flex',
		justifyContent: 'center',
		minHeight: '72px',
	},
	specimen: {
		borderRadius: radii.xs,
		borderStyle: 'solid',
		borderWidth: '1px',
		paddingBlock: spacing.xs,
		paddingInline: spacing.sm,
		fontSize: '0.6875rem',
		textAlign: 'center',
		width: '100%',
	},
	paint: (background: string, foreground: string, border: string) => ({
		borderColor: border,
		backgroundColor: background,
		color: foreground,
	}),
	outline: (value: string) => ({
		outlineColor: value,
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	}),
	shadow: (value: string) => ({ boxShadow: `0 8px 20px ${value}` }),
})

export function ColorStateMatrix() {
	return (
		<section id='color-state-matrix'>
			<header {...stylex.props(styles.header)}>
				<h3 {...stylex.props(styles.title)}>Component state matrix</h3>
				<p {...stylex.props(styles.description)}>
					Forced semantic states expose progression and role
					differences without interaction.
				</p>
			</header>
			<div {...stylex.props(styles.overflow)}>
				<div {...stylex.props(styles.matrix)}>
					<span />
					{colorStates.map(state => (
						<span key={state} {...stylex.props(styles.label)}>
							{state}
						</span>
					))}
					{colorStateRows.flatMap(row => [
						<span
							key={`${row.label}-label`}
							{...stylex.props(styles.label)}
						>
							{row.label}
						</span>,
						...colorStates.map(state => {
							const paint = row.states[state]
							return (
								<div
									key={`${row.label}-${state}`}
									{...stylex.props(styles.cell)}
								>
									<span
										{...stylex.props(
											styles.specimen,
											styles.paint(
												colors[
													paint.background ??
														'bgSurface'
												] as string,
												colors[
													paint.foreground ?? 'text'
												] as string,
												colors[
													paint.border ?? 'border'
												] as string,
											),
											paint.outline &&
												styles.outline(
													colors[
														paint.outline
													] as string,
												),
											paint.effect &&
												styles.shadow(
													colors[
														paint.effect
													] as string,
												),
										)}
									>
										{state}
									</span>
								</div>
							)
						}),
					])}
				</div>
			</div>
		</section>
	)
}
