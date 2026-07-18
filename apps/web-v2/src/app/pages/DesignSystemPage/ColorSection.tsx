import * as stylex from '@stylexjs/stylex'

import { fontSizes, spacing } from '~/styles/tokens.stylex'

import { COLOR_TOKEN_COUNT, EFFECT_TOKEN_COUNT } from './colorCatalog.generated'
import { ColorForegroundMatrix } from './ColorForegroundMatrix'
import { ColorPrimitiveView } from './ColorPrimitiveView'
import { ColorStateMatrix } from './ColorStateMatrix'
import { ColorTokenCatalog } from './ColorTokenCatalog'
import { SpecimenSection } from './SpecimenSection'

const styles = stylex.create({
	stack: {
		gap: spacing['4xl'],
		display: 'flex',
		flexDirection: 'column',
	},
	intro: {
		fontSize: fontSizes.sm,
		lineHeight: 1.6,
		maxWidth: '72ch',
	},
})

export function ColorSection() {
	return (
		<SpecimenSection
			id='color'
			title='Color'
			meta={`${COLOR_TOKEN_COUNT} Polaris roles · ${EFFECT_TOKEN_COUNT} local effects · live StyleX paint`}
		>
			<div {...stylex.props(styles.stack)}>
				<p {...stylex.props(styles.intro)}>
					Polaris supplies the semantic taxonomy; Radix primitives
					supply the paint. Brand is iris, emphasis is blue, and magic
					remains violet. Every specimen below uses the same StyleX
					variable as the product and responds to the system color
					scheme.
				</p>
				<ColorTokenCatalog />
				<ColorForegroundMatrix />
				<ColorStateMatrix />
				<ColorPrimitiveView />
			</div>
		</SpecimenSection>
	)
}
