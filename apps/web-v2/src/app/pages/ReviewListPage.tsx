import * as stylex from '@stylexjs/stylex'
import { Maximize2 } from 'lucide-react'
import { useState } from 'react'

import { FocusOverlay } from '~/components/FocusOverlay'
import { Button } from '~/components/ui'
import { ReviewCard } from '~/modules/reviews/components/ReviewCard'
import type { ReviewCard as ReviewCardModel } from '~/modules/reviews/types/review.types'
import { deriveReviewCardSrsState } from '~/modules/reviews/utils/reviewCardSrs'
import { colors } from '~/styles/colors.stylex'
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
		padding: spacing.xl,
		overflowY: 'auto',
	},
	heading: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
	empty: {
		color: colors.textSecondary,
		fontSize: fontSizes.sm,
	},
})

export function ReviewListPage({
	reviewCards,
	title,
	today,
}: ReviewListPageProps) {
	const [focusOpen, setFocusOpen] = useState(false)

	return (
		<>
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.heading)}>
					<h2 {...stylex.props(styles.title)}>{title}</h2>
					<Button
						variant='secondary'
						shape='round'
						onClick={() => {
							setFocusOpen(true)
						}}
					>
						<Maximize2 size={iconSizes.md} />
						Focus
					</Button>
				</div>
				{reviewCards.length === 0 ? (
					<p {...stylex.props(styles.empty)}>No cards here.</p>
				) : null}
				{reviewCards.map(reviewCard => {
					return (
						<ReviewCard
							key={reviewCard._id}
							reviewCard={reviewCard}
							srs={deriveReviewCardSrsState(reviewCard, today)}
							today={today}
						/>
					)
				})}
			</div>
			<FocusOverlay open={focusOpen} onOpenChange={setFocusOpen} />
		</>
	)
}
