import * as stylex from '@stylexjs/stylex'
import { Maximize2 } from 'lucide-react'
import { useState } from 'react'

import { Button, createDialogHandle, DialogTrigger } from '~/components/ui'
import { CardItem } from '~/modules/reviews/components/CardItem'
import { FocusOverlayDialog } from '~/modules/reviews/components/focus-overlay/FocusOverlayDialog'
import type { Card as CardModel } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

type ReviewListPageProps = {
	cards: Array<CardModel>
	today: DateString
	title: string
}

const styles = stylex.create({
	content: {
		marginBlock: spacing.xl,
	},
	heading: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',
		marginBlockEnd: spacing.sm,
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
	empty: {
		color: semanticColors.textSecondary,
		fontSize: fontSizes.sm,
	},
})

export function ReviewListPage({ cards, title, today }: ReviewListPageProps) {
	const [focusDialogHandle] = useState(createDialogHandle)
	const cardCount = cards.length

	return (
		<>
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.heading)}>
					<h1 {...stylex.props(styles.title)}>{title}</h1>
					<DialogTrigger
						handle={focusDialogHandle}
						disabled={cardCount === 0}
						render={<Button variant='secondary' shape='round' />}
					>
						<Maximize2 size={iconSizes.md} />
						Focus
					</DialogTrigger>
				</div>
				{cardCount === 0 ? (
					<p {...stylex.props(styles.empty)}>
						No {title.toLowerCase()} cards.
					</p>
				) : null}
				{cards.map(card => (
					<CardItem
						key={card._id}
						card={card}
						srs={deriveCardSrsState(card, today)}
						today={today}
					/>
				))}
			</div>
			<FocusOverlayDialog handle={focusDialogHandle} cards={cards} />
		</>
	)
}
