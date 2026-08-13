import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { Separator, Textarea } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

import { useHideMode } from '../hide-mode/useHideMode'
import { useReviewCardField } from '../hooks/useReviewCardField'
import type { Review, ReviewCard } from '../types/review.types'
import { deriveReviewCardSrsState } from '../utils/reviewCardSrs'
import { Hideable } from './Hideable'
import { ReviewCardActions } from './ReviewCardActions'
import { ReviewCardMetadata } from './ReviewCardMetadata'
import { ReviewsSidebar } from './ReviewsSidebar'

const styles = stylex.create({
	layout: {
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	main: {
		overflow: 'auto',
		paddingBlock: spacing.xl,
		paddingInline: spacing.sm,
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minWidth: 0,
	},
	content: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		maxWidth: layout.contentMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	secondary: { fontSize: fontSizes.md },
	separatorGroup: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
	footer: { gap: spacing.md, alignItems: 'center', display: 'flex' },
	notesContainer: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	notes: { blockSize: '100%', fontSize: fontSizes.md, inlineSize: '100%' },
})

type ReviewCardOverviewProps = {
	// TODO(4): Reconsider accepting only reviewCardId if every caller eventually
	// has a persisted card and benefits from an independent reactive subscription.
	reviewCard: ReviewCard
	readOnly?: boolean
	reviews?: ReadonlyArray<Review>
}

export function ReviewCardOverview({
	reviewCard,
	readOnly = false,
	reviews,
}: ReviewCardOverviewProps) {
	const reviewCardId = reviewCard._id
	const { hideMode } = useHideMode()
	const [secondaryRevealed, setSecondaryRevealed] = useState(false)
	const [notesRevealed, setNotesRevealed] = useState(false)
	const today = useToday()

	useEffect(() => {
		setSecondaryRevealed(false)
		setNotesRevealed(false)
	}, [hideMode, reviewCardId])

	const primaryText = useReviewCardField({
		errorMessage: 'Failed to update review card',
		field: 'primaryText',
		reviewCardId,
		value: reviewCard.primaryText,
	})
	const secondaryText = useReviewCardField({
		errorMessage: 'Failed to update review card',
		field: 'secondaryText',
		reviewCardId,
		value: reviewCard.secondaryText,
	})
	const notes = useReviewCardField({
		errorMessage: 'Failed to update review card notes',
		field: 'notes',
		reviewCardId,
		value: reviewCard.notes,
	})

	const primaryTextPlaceholder =
		reviewCard.type === 'practice' ? 'Title' : 'Prompt'
	const secondaryTextPlaceholder =
		reviewCard.type === 'practice' ? 'Description' : 'Answer'

	return (
		<div {...stylex.props(styles.layout)}>
			<main {...stylex.props(styles.main)}>
				<div {...stylex.props(styles.content)}>
					<Textarea
						aria-label='Review-card primary text'
						placeholder={primaryTextPlaceholder}
						onBlur={readOnly ? undefined : primaryText.flush}
						onChange={readOnly ? undefined : primaryText.onChange}
						readOnly={readOnly}
						value={primaryText.value}
						xstyle={styles.primary}
					/>
					<Hideable
						revealed={
							reviewCard.type === 'practice' ||
							hideMode === 'off' ||
							secondaryRevealed
						}
						onRevealedChange={setSecondaryRevealed}
					>
						<Textarea
							aria-label='Review-card secondary text'
							placeholder={secondaryTextPlaceholder}
							onBlur={readOnly ? undefined : secondaryText.flush}
							onChange={
								readOnly ? undefined : secondaryText.onChange
							}
							readOnly={readOnly}
							value={secondaryText.value}
							xstyle={styles.secondary}
						/>
					</Hideable>
					<div {...stylex.props(styles.separatorGroup)}>
						<div {...stylex.props(styles.footer)}>
							<ReviewCardMetadata
								{...deriveReviewCardSrsState(reviewCard, today)}
								today={today}
							/>
							{readOnly ? null : (
								<ReviewCardActions reviewCard={reviewCard} />
							)}
						</div>
						<Separator />
					</div>
					<Hideable
						revealed={hideMode === 'off' || notesRevealed}
						onRevealedChange={setNotesRevealed}
						xstyle={styles.notesContainer}
					>
						<Textarea
							aria-label='Review-card notes'
							placeholder='Add notes...'
							onBlur={readOnly ? undefined : notes.flush}
							onChange={readOnly ? undefined : notes.onChange}
							readOnly={readOnly}
							value={notes.value}
							xstyle={styles.notes}
						/>
					</Hideable>
				</div>
			</main>
			<ReviewsSidebar
				readOnly={readOnly}
				reviewCardId={reviewCardId}
				reviews={reviews}
			/>
		</div>
	)
}
