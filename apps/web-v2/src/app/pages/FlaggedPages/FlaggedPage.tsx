import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'

import { useToday } from '~/hooks/useToday'
import { cardQueries } from '~/modules/reviews/api/cardQueries'
import { layout, spacing } from '~/styles/tokens.stylex'

import { FlaggedCardList } from './FlaggedCardList'

const styles = stylex.create({
	container: {
		display: 'flex',
		justifyContent: 'center',
		minHeight: '100%',
		width: '100%',
	},
	content: {
		marginInline: spacing.lg,
		maxWidth: layout.contentColumnMaxWidth,
		minWidth: 0,
		width: '100%',
	},
})

export function FlaggedPage() {
	const today = useToday()
	const { data: flaggedCards } = useSuspenseQuery(cardQueries.listFlagged())

	return (
		<div {...stylex.props(styles.container)}>
			<div {...stylex.props(styles.content)}>
				<FlaggedCardList cards={flaggedCards} today={today} />
			</div>
		</div>
	)
}
