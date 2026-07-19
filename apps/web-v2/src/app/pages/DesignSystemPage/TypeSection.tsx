import * as stylex from '@stylexjs/stylex'

import { colors } from '~/styles/colors.stylex'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

import {
	fontSizeSpecimens,
	fontWeightSpecimens,
	TYPE_SPECIMEN_LINE,
} from './specimens.data'
import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	subhead: {
		color: colors.textSecondary,
		fontSize: fontSizes.xs,
		letterSpacing: '0.08em',
		textTransform: 'uppercase',

		marginBottom: spacing.lg,
	},
	subheadGap: {
		marginTop: spacing['3xl'],
	},

	faces: {
		display: 'grid',
		gridTemplateColumns: '1fr',
	},
	faceCard: {
		paddingBlock: spacing.xl,
		paddingInline: spacing.lg,
	},
	faceGlyphs: {
		fontSize: '2.5rem',
		fontWeight: fontWeights.medium,
		letterSpacing: '-0.02em',
		lineHeight: 1.1,
	},
	faceName: {
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.semibold,

		marginTop: spacing.md,
	},
	faceRole: {
		color: colors.textSecondary,
		fontSize: fontSizes.xs,

		marginTop: spacing.xs,
	},

	rows: {
		gap: spacing.lg,

		display: 'flex',
		flexDirection: 'column',
	},
	row: {
		gap: spacing.xl,

		alignItems: 'baseline',
		display: 'flex',

		paddingBlock: spacing.md,
	},
	rowLabel: {
		color: colors.textSecondary,
		fontSize: fontSizes.xs,

		flexShrink: 0,
		width: '120px',
	},
	sample: {
		color: colors.text,

		flexGrow: 1,
		minWidth: 0,

		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	sampleFontSize: (value: string) => ({
		fontSize: value,
	}),
	sampleFontWeight: (value: string) => ({
		fontWeight: value,
	}),
})

export function TypeSection() {
	return (
		<SpecimenSection id='type' title='Type' meta='Inter variable'>
			<p {...stylex.props(styles.subhead)}>Typefaces</p>
			<div {...stylex.props(styles.faces)}>
				<div {...stylex.props(styles.faceCard)}>
					<div {...stylex.props(styles.faceGlyphs)}>Aa Gg 24</div>
					<div {...stylex.props(styles.faceName)}>Inter</div>
					<div {...stylex.props(styles.faceRole)}>
						fonts.sans · interface & prose
					</div>
				</div>
			</div>

			<p {...stylex.props(styles.subhead, styles.subheadGap)}>Size</p>
			<div {...stylex.props(styles.rows)}>
				{fontSizeSpecimens.map(size => (
					<div key={size.name} {...stylex.props(styles.row)}>
						<span {...stylex.props(styles.rowLabel)}>
							{size.name} · {size.value}
						</span>
						<span
							{...stylex.props(
								styles.sample,
								styles.sampleFontSize(size.value),
							)}
						>
							{TYPE_SPECIMEN_LINE}
						</span>
					</div>
				))}
			</div>

			<p {...stylex.props(styles.subhead, styles.subheadGap)}>Weight</p>
			<div {...stylex.props(styles.rows)}>
				{fontWeightSpecimens.map(weight => (
					<div key={weight.name} {...stylex.props(styles.row)}>
						<span {...stylex.props(styles.rowLabel)}>
							{weight.name} · {weight.value}
						</span>
						<span
							{...stylex.props(
								styles.sample,
								styles.sampleFontWeight(weight.value),
							)}
						>
							{TYPE_SPECIMEN_LINE}
						</span>
					</div>
				))}
			</div>
		</SpecimenSection>
	)
}
