import * as stylex from '@stylexjs/stylex'

import { neutral } from '~/styles/colors/colorsPrimitive.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { radiiSpecimens, spacingSpecimens } from './specimens.data'
import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	subhead: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,
		letterSpacing: '0.08em',
		textTransform: 'uppercase',

		marginBottom: spacing.lg,
	},
	subheadGap: {
		marginTop: spacing['3xl'],
	},

	ruler: {
		display: 'flex',
		flexDirection: 'column',
	},
	rulerRow: {
		gap: spacing.lg,

		alignItems: 'center',
		display: 'flex',

		paddingBlock: spacing.md,
	},
	rulerLabel: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,

		flexShrink: 0,
		textAlign: 'right',
		width: '96px',
	},
	bar: {
		borderRadius: radii.xl,

		backgroundColor: { [DARK]: neutral.s800, default: neutral.s100 },
		height: '10px',
	},
	barWidth: (value: string) => ({
		width: value,
	}),

	radii: {
		gap: spacing.xl,

		display: 'flex',
		flexWrap: 'wrap',
	},
	radiusItem: {
		gap: spacing.md,

		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
	},
	radiusBox: {
		borderColor: { [DARK]: neutral.s600, default: neutral.s300 },
		borderStyle: 'solid',
		borderWidth: '2px',

		backgroundColor: { [DARK]: neutral.s800, default: neutral.s100 },

		height: '72px',
		width: '72px',
	},
	radius: (value: string) => ({
		borderRadius: value,
	}),
	radiusLabel: {
		color: { [DARK]: neutral.s400, default: neutral.s600 },
		fontSize: fontSizes.xs,
	},
})

export function ScaleSection() {
	return (
		<SpecimenSection
			id='scale'
			title='Space & radius'
			meta={`${spacingSpecimens.length} steps · ${radiiSpecimens.length} corners`}
		>
			<p {...stylex.props(styles.subhead)}>Spacing</p>
			<div {...stylex.props(styles.ruler)}>
				{spacingSpecimens.map(step => (
					<div key={step.name} {...stylex.props(styles.rulerRow)}>
						<span {...stylex.props(styles.rulerLabel)}>
							{step.name} · {step.value}
						</span>
						<span
							{...stylex.props(
								styles.bar,
								styles.barWidth(step.value),
							)}
						/>
					</div>
				))}
			</div>

			<p {...stylex.props(styles.subhead, styles.subheadGap)}>Radius</p>
			<div {...stylex.props(styles.radii)}>
				{radiiSpecimens.map(radius => (
					<div key={radius.name} {...stylex.props(styles.radiusItem)}>
						<span
							{...stylex.props(
								styles.radiusBox,
								styles.radius(radius.value),
							)}
						/>
						<span {...stylex.props(styles.radiusLabel)}>
							{radius.name} · {radius.value}
						</span>
					</div>
				))}
			</div>
		</SpecimenSection>
	)
}
