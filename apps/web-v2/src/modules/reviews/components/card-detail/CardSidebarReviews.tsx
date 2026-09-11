import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { ReviewComposer } from '../ReviewComposer'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	composer: {
		marginInline: 0,
		flexShrink: 0,
		inlineSize: '100%',
	},
})

type CardSidebarReviewsProps = {
	cardId: Id<'cards'>
}

export function CardSidebarReviews({ cardId }: CardSidebarReviewsProps) {
	return (
		<>
			<ReviewComposer xstyle={styles.composer} />
			<CardReviewsPanel cardId={cardId} />
		</>
	)
}
