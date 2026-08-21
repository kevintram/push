import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { Separator, Textarea } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

import { reviewCardQueries } from '../api/reviewCardQueries'
import { useHideMode } from '../hide-mode/useHideMode'
import { useReviewCardField } from '../hooks/useReviewCardField'
import { deriveReviewCardSrsState } from '../utils/reviewCardSrs'
import { Hideable } from './Hideable'
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
		paddingInline: spacing.lg,
		display: 'flex',
		justifyContent: 'center',
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
	reviewCardId: Id<'reviewCards'>
}

export function ReviewCardOverview({ reviewCardId }: ReviewCardOverviewProps) {
	// TODO(2): Focus mode already has the full live card, but this ID-only API
	// opens another detail subscription for every card visited. Accept supplied
	// card data and shorten overlay-only query GC so large queues do not retain
	// redundant Convex subscriptions.
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)
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
						onBlur={primaryText.flush}
						onChange={primaryText.onChange}
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
							onBlur={secondaryText.flush}
							onChange={secondaryText.onChange}
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
							onBlur={notes.flush}
							onChange={notes.onChange}
							value={notes.value}
							xstyle={styles.notes}
						/>
					</Hideable>
				</div>
			</main>
			<ReviewsSidebar reviewCardId={reviewCardId} />
		</div>
	)
}
