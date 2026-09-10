import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'

import { breakpoints, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import type { CardSrsState } from '../../types/review.types'
import { CardPropertiesPanel } from './CardPropertiesPanel'
import { CardSidebarReviews } from './CardSidebarReviews'

const styles = stylex.create({
	container: {
		gap: spacing.sm,
		display: {
			default: 'none',
			[breakpoints.tablet]: 'flex',
		},
		flexDirection: 'column',
		flexShrink: 0,
		inlineSize: '320px',
		maxBlockSize: '100%',
		minBlockSize: 0,
		overflowY: 'auto',
	},
})

type CardSidebarProps = CardSrsState & {
	cardId: Id<'cards'>
	showReviews: boolean
	today: DateString
}

export function CardSidebar({
	cardId,
	showReviews,
	today,
	...srsState
}: CardSidebarProps) {
	return (
		<aside aria-label='Card details' {...stylex.props(styles.container)}>
			{showReviews && <CardSidebarReviews cardId={cardId} key={cardId} />}
			<CardPropertiesPanel {...srsState} today={today} />
		</aside>
	)
}
