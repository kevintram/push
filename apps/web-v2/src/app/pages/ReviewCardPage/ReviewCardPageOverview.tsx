import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useCallback } from 'react'

import { Hideable } from '~/components/Hideable'
import { Separator, Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { useUpdateReviewCard } from '~/modules/reviews/api/updateReviewCard'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		display: 'flex',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	main: {
		padding: spacing.xl,
		gap: spacing.xs,

		display: 'flex',
		flexDirection: 'column',

		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	secondary: { fontSize: fontSizes.md },
	separator: {
		marginBlock: spacing.xl,
	},
	notesContainer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	notes: {
		blockSize: '100%',
		inlineSize: '100%',

		fontSize: fontSizes.md,
	},
})

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { data: reviewCard } = useSuspenseQuery(
		reviewCardQueries.detail(reviewCardId),
	)
	const { mutate } = useUpdateReviewCard()
	const save = useCallback(
		(field: 'primary_text' | 'secondary_text' | 'notes', value: string) => {
			if (value === reviewCard[field]) return
			mutate({ id: reviewCard.id, [field]: value })
		},
		[mutate, reviewCard],
	)
	const primary = useAutoSave({
		initialValue: reviewCard.primary_text,
		onSave: value => save('primary_text', value),
		key: `review-card-primary-${reviewCard.id}`,
	})
	const secondary = useAutoSave({
		initialValue: reviewCard.secondary_text,
		onSave: value => save('secondary_text', value),
		key: `review-card-secondary-${reviewCard.id}`,
	})
	const notes = useAutoSave({
		initialValue: reviewCard.notes,
		onSave: value => save('notes', value),
		key: `review-card-notes-${reviewCard.id}`,
	})

	return (
		<div {...stylex.props(styles.container)}>
			<main {...stylex.props(styles.main)}>
				<Textarea
					aria-label='Review-card primary text'
					placeholder='Primary text'
					value={primary.value}
					onChange={primary.onChange}
					onBlur={primary.flush}
					xstyle={styles.primary}
				/>
				<Textarea
					aria-label='Review-card secondary text'
					placeholder='Secondary text'
					value={secondary.value}
					onChange={secondary.onChange}
					onBlur={secondary.flush}
					xstyle={styles.secondary}
				/>
				<Separator xstyle={styles.separator} />
				<Hideable key={reviewCardId} xstyle={styles.notesContainer}>
					<Textarea
						aria-label='Review-card notes'
						placeholder='Add notes'
						value={notes.value}
						onChange={notes.onChange}
						onBlur={notes.flush}
						xstyle={styles.notes}
					/>
				</Hideable>
			</main>
			<aside>
				<ReviewsSidebar />
			</aside>
		</div>
	)
}
