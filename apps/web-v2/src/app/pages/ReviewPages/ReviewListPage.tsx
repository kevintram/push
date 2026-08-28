import * as stylex from '@stylexjs/stylex'
import { Maximize2 } from 'lucide-react'
import { useState } from 'react'

import { Button, createDialogHandle, DialogTrigger } from '~/components/ui'
import { FocusOverlayDialog } from '~/modules/reviews/components/focus-overlay/FocusOverlayDialog'
import { ReviewCardItem } from '~/modules/reviews/components/ReviewCardItem'
import type { ReviewCard as ReviewCardModel } from '~/modules/reviews/types/review.types'
import { deriveReviewCardSrsState } from '~/modules/reviews/utils/reviewCardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

type ReviewListPageProps = {
	reviewCards: Array<ReviewCardModel>
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

export function ReviewListPage({
	reviewCards,
	title,
	today,
}: ReviewListPageProps) {
	const [focusDialogHandle] = useState(createDialogHandle)
	const cardCount = reviewCards.length

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
						No {title.toLowerCase()} review cards.
					</p>
				) : null}
				{reviewCards.map(reviewCard => (
					<ReviewCardItem
						key={reviewCard._id}
						reviewCard={reviewCard}
						srs={deriveReviewCardSrsState(reviewCard, today)}
						today={today}
					/>
				))}
			</div>
			<FocusOverlayDialog
				handle={focusDialogHandle}
				reviewCards={reviewCards}
			/>
		</>
	)
}
