import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { scrollFade } from '~/styles/scrollFade'
import { spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { CardSrsState } from '../../types/review.types'
import { CardPropertiesPanel } from './CardPropertiesPanel'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: 'clamp(240px, 30%, 320px)',
		maxBlockSize: '100%',
		minBlockSize: 0,
		overflowY: 'auto',
	},
})

type CardSidebarProps = CardSrsState & {
	id: string
	cardId: Id<'cards'>
	showReviews: boolean
	today: DateString
	xstyle?: stylex.StyleXStyles
}

export function CardSidebar({
	id,
	cardId,
	showReviews,
	today,
	xstyle,
	...srsState
}: CardSidebarProps) {
	return (
		<aside
			id={id}
			aria-label='Card details'
			{...stylex.props(styles.container, scrollFade.y, xstyle)}
		>
			{showReviews && <CardReviewsPanel cardId={cardId} />}
			<CardPropertiesPanel {...srsState} today={today} />
		</aside>
	)
}
