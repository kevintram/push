import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import {
	ChevronLeft,
	ChevronRight,
	SquareArrowOutUpRight,
	X,
} from 'lucide-react'

import {
	Button,
	Dialog,
	DialogClose,
	DialogContent,
	type DialogHandle,
} from '~/components/ui'
import { ReviewCardOverview } from '~/modules/reviews/components/ReviewCardOverview'
import type { Review, ReviewCard } from '~/modules/reviews/types/review.types'
import { colors } from '~/styles/colors.stylex'
import { iconSizes, radii, spacing } from '~/styles/tokens.stylex'

type FocusOverlayProps = {
	handle: DialogHandle
}

const dummyReviewCard: ReviewCard = {
	_id: 'focus-overlay-dummy-card' as Id<'reviewCards'>,
	_creationTime: 0,
	topicId: 'focus-overlay-dummy-topic' as Id<'topics'>,
	ownerId: 'focus-overlay-dummy-owner',
	type: 'flashcard',
	primaryText: 'What should focused review feel like?',
	secondaryText: 'Calm, clear, and free from the rest of the queue.',
	notes: 'Dummy review card for testing the focus overlay layout.',
	state: 'LEARNING',
}

const dummyReviews: ReadonlyArray<Review> = [
	{
		_id: 'focus-overlay-dummy-review-1' as Id<'reviews'>,
		_creationTime: 1,
		reviewCardId: dummyReviewCard._id,
		ownerId: dummyReviewCard.ownerId,
		rating: 'good',
		date: '2026-08-10',
		description: 'Stayed focused and recalled the answer.',
		notes: '',
	},
	{
		_id: 'focus-overlay-dummy-review-2' as Id<'reviews'>,
		_creationTime: 0,
		reviewCardId: dummyReviewCard._id,
		ownerId: dummyReviewCard.ownerId,
		description: 'Scheduled for another attempt.',
		notes: 'Try recalling before revealing the answer.',
	},
]

const styles = stylex.create({
	content: {
		gap: 0,
		display: 'flex',
		flexDirection: 'column',

		backgroundColor: colors.bgSurface,

		paddingBlockStart: 0,
	},
	inner: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		borderRadius: radii.lg,
		backgroundColor: colors.bg,

		padding: spacing.lg,
	},
	header: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',

		paddingBlock: spacing.lg,
	},
	headerButtonCluster: {
		gap: spacing.xs,
		display: 'flex',
	},
})

export function FocusOverlay({ handle }: FocusOverlayProps) {
	return (
		<Dialog handle={handle}>
			<DialogContent
				size='fullscreen'
				xstyle={styles.content}
				showCloseButton={false}
			>
				<div {...stylex.props(styles.header)}>
					<div {...stylex.props(styles.headerButtonCluster)}>
						<Button.Icon
							aria-label='Previous review card'
							shape='round'
							variant='secondary'
							size='small'
						>
							<ChevronLeft size={iconSizes.md} />
						</Button.Icon>
						<Button.Icon
							aria-label='Next review card'
							shape='round'
							variant='secondary'
							size='small'
						>
							<ChevronRight size={iconSizes.md} />
						</Button.Icon>
					</div>
					<div {...stylex.props(styles.headerButtonCluster)}>
						<Button.Icon
							aria-label='Open review card'
							shape='round'
							variant='ghost'
							size='small'
						>
							<SquareArrowOutUpRight size={iconSizes.md} />
						</Button.Icon>
						<DialogClose
							render={
								<Button.Icon
									aria-label='Close'
									shape='round'
									variant='ghost'
									size='small'
								/>
							}
						>
							<X aria-hidden='true' size={iconSizes.md} />
						</DialogClose>
					</div>
				</div>
				<div {...stylex.props(styles.inner)}>
					<ReviewCardOverview
						readOnly
						reviewCard={dummyReviewCard}
						reviews={dummyReviews}
					/>
				</div>
			</DialogContent>
		</Dialog>
	)
}
