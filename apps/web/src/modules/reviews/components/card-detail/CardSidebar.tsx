import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { ResizeHandle } from '~/components/ResizeHandle'
import { useResizableWidth } from '~/hooks/useResizableWidth'
import { scrollFade } from '~/styles/scrollFade'
import { spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { CardSrsState } from '../../types/review.types'
import { CardPropertiesPanel } from './CardPropertiesPanel'
import { CardReviewsPanel } from './CardReviewsPanel'

const styles = stylex.create({
	// Holds the resize handle outside the scrolling content.
	container: {
		flexDirection: 'column',
		flexShrink: 0,
		maxBlockSize: '100%',
		// Leaves the card content at least half the row.
		maxInlineSize: '50%',
		minBlockSize: 0,
		position: 'relative',
	},
	width: (width: number) => ({
		inlineSize: `${width}px`,
	}),
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
	xstyle?: stylex.StyleXStyles
}

export function CardSidebar({
	id,
	cardId,
	showReviews,
	onSeeAllReviews,
	today,
	xstyle,
	...srsState
}: CardSidebarProps) {
	const { width, handleProps } = useResizableWidth({
		storageKey: 'cardSidebarWidth',
		defaultWidth: 320,
		minWidth: 240,
		maxWidth: 480,
		edge: 'start',
	})

	return (
		<aside
			id={id}
			aria-label='Card details'
			{...stylex.props(styles.container, styles.width(width), xstyle)}
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
			<ResizeHandle {...handleProps} />
		</aside>
	)
}
