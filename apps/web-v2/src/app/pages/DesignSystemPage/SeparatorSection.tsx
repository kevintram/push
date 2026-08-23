import * as stylex from '@stylexjs/stylex'

import { Separator } from '~/components/ui'
import { grayDark, grayLight } from '~/styles/colorPrimitives.stylex'

const DARK = '@media (prefers-color-scheme: dark)'
import { fontSizes, radii, spacing } from '~/styles/tokens.stylex'

import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	demo: {
		gap: spacing.xl,

		display: 'flex',
		flexDirection: 'column',

		paddingBlock: spacing.xl,
		paddingInline: spacing.xl,
	},
	line: {
		gap: spacing.md,

		alignItems: 'center',
		display: 'flex',

		color: { [DARK]: grayDark.s11, default: grayLight.s11 },
		fontSize: fontSizes.sm,
	},
	panel: {
		gap: spacing.lg,

		alignItems: 'stretch',
		display: 'flex',

		blockSize: '4rem',
		color: { [DARK]: grayDark.s11, default: grayLight.s11 },
		fontSize: fontSizes.sm,
	},
	panelItem: {
		borderColor: { [DARK]: grayDark.s6, default: grayLight.s6 },
		borderRadius: radii.sm,
		borderStyle: 'solid',
		borderWidth: '1px',
		flex: '1',
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',
	},
})

export function SeparatorSection() {
	return (
		<SpecimenSection
			id='separator'
			title='Separator'
			meta='Horizontal · vertical'
		>
			<div {...stylex.props(styles.demo)}>
				<div {...stylex.props(styles.line)}>
					<span>Review queue</span>
					<Separator />
					<span>24 cards</span>
				</div>
				<div {...stylex.props(styles.panel)}>
					<div {...stylex.props(styles.panelItem)}>Due</div>
					<Separator orientation='vertical' />
					<div {...stylex.props(styles.panelItem)}>Late</div>
				</div>
			</div>
		</SpecimenSection>
	)
}
