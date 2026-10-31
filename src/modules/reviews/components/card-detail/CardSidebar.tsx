import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { scrollFade } from '~/styles/scrollFade'
import { spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { CardSrsState } from '../../types/review.types'
import { CardPropertiesPanel } from './CardPropertiesPanel'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	// Fills the slot CardDetail sizes and resizes.
	container: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		maxBlockSize: '100%',
		minBlockSize: 0,
		minInlineSize: 0,
	},
	scroller: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
		minBlockSize: 0,
		overflowY: 'auto',
	},
})

type CardSidebarProps = CardSrsState & {
	id: string
	cardId: Id<'cards'>
	showReviews: boolean
	onSeeAllReviews?: () => void
	today: DateString
}

export function CardSidebar({
	id,
	cardId,
	showReviews,
	onSeeAllReviews,
	today,
	...srsState
}: CardSidebarProps) {
	return (
		<aside
			id={id}
			aria-label='Card details'
			{...stylex.props(styles.container)}
		>
			<div {...stylex.props(styles.scroller, scrollFade.y)}>
				{showReviews && (
					<CardReviewsPanel
						cardId={cardId}
						onSeeAll={onSeeAllReviews}
					/>
				)}
				<CardPropertiesPanel {...srsState} today={today} />
			</div>
		</aside>
	)
}
