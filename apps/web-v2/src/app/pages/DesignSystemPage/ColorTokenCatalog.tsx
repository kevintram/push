import * as stylex from '@stylexjs/stylex'

import { spacing } from '~/styles/tokens.stylex'

import { colorTokenCategories } from './colorCatalog.generated'
import { ColorEffectsView } from './ColorEffectsView'
import { ColorTokenCategory } from './ColorTokenCategory'

const styles = stylex.create({
	stack: { gap: spacing['4xl'], display: 'flex', flexDirection: 'column' },
})

export function ColorTokenCatalog() {
	return (
		<div {...stylex.props(styles.stack)}>
			{colorTokenCategories.map(category => (
				<ColorTokenCategory category={category} key={category.id} />
			))}
			<ColorEffectsView />
		</div>
	)
}
