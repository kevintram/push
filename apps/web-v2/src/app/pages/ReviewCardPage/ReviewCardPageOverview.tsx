import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'

import { Separator, Textarea } from '~/components/ui'
import { reviewCardQueries } from '~/modules/reviews/api/reviewCardQueries'
import { Hideable } from '~/modules/reviews/components/Hideable'
import { ReviewCardActions } from '~/modules/reviews/components/ReviewCardActions'
import { ReviewCardMetadata } from '~/modules/reviews/components/ReviewCardMetadata'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'
import { useHideMode } from '~/modules/reviews/hide-mode/useHideMode'
import { useReviewCardField } from '~/modules/reviews/hooks/useReviewCardField'
import { deriveReviewCardSrsState } from '~/modules/reviews/utils/reviewCardSrs'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

const styles = stylex.create({
	layout: {
		display: 'flex',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,

		overflow: 'hidden',
	},
	main: {
		paddingBlock: spacing.xl,
		paddingInline: spacing.sm,

		display: 'flex',
		justifyContent: 'center',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 0,

		overflow: 'auto',
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

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({ from: '/review-cards/$reviewCardId' })
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)

	const { hideMode } = useHideMode()
	const [secondaryRevealed, setSecondaryRevealed] = useState(false)
	const [notesRevealed, setNotesRevealed] = useState(false)
	const today = DateTime.utc().toISODate() as DateString

	useEffect(() => {
		setSecondaryRevealed(false)
		setNotesRevealed(false)
	}, [hideMode, reviewCardId])

	const primaryText = useReviewCardField({
		errorMessage: 'Failed to update review card',
		field: 'primaryText',
		reviewCardId,
		value: reviewCard?.primaryText ?? '',
	})
	const secondaryText = useReviewCardField({
		errorMessage: 'Failed to update review card',
		field: 'secondaryText',
		reviewCardId,
		value: reviewCard?.secondaryText ?? '',
	})
	const notes = useReviewCardField({
		errorMessage: 'Failed to update review card notes',
		field: 'notes',
		reviewCardId,
		value: reviewCard?.notes ?? '',
	})

	// The parent layout stops rendering the outlet in this case, so this is
	// belt-and-braces for the render that may still be in flight.
	if (!reviewCard) return null

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
							/>
							<ReviewCardActions reviewCard={reviewCard} />
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
			<aside>
				<ReviewsSidebar />
			</aside>
		</div>
	)
}
