import * as stylex from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { reviewCardQueries } from '~/modules/reviews/api/queries'
import { useUpdateReviewCard } from '~/modules/reviews/api/updateReviewCard'
import { ReviewsSidebar } from '~/modules/reviews/components/ReviewsSidebar'
import { fontSizes, fontWeights, spacing } from '~/styles/tokens.stylex'

const styles = stylex.create({
	container: {
		display: 'flex',
	},
	main: {
		padding: '24px',
		gap: spacing.md,
		display: 'flex',
		flexBasis: 0,
		flexDirection: 'column',
		flexGrow: 1,
		flexShrink: 1,
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
		minBlockSize: '44px',
	},
	secondary: { fontSize: fontSizes.md },
	notes: { fontSize: fontSizes.sm, minBlockSize: '96px' },
})

export function ReviewCardPageOverview() {
	const { reviewCardId } = useParams({
		from: '/review-cards/$reviewCardId',
	})
	const { data: reviewCard } = useQuery(
		reviewCardQueries.detail(reviewCardId),
	)
	const { mutateAsync } = useUpdateReviewCard()
	const save = useCallback(
		async (
			field: 'primary_text' | 'secondary_text' | 'notes',
			value: string,
			message: string,
		) => {
			if (!reviewCard || value === reviewCard[field]) return
			try {
				await mutateAsync({ id: reviewCard.id, [field]: value })
			} catch {
				toast.error(message)
			}
		},
		[mutateAsync, reviewCard],
	)
	const primary = useAutoSave({
		initialValue: reviewCard?.primary_text ?? '',
		onSave: value =>
			void save(
				'primary_text',
				value,
				'Failed to update review-card primary text',
			),
		key: `review-card-primary-${reviewCard?.id ?? reviewCardId}`,
	})
	const secondary = useAutoSave({
		initialValue: reviewCard?.secondary_text ?? '',
		onSave: value =>
			void save(
				'secondary_text',
				value,
				'Failed to update review-card secondary text',
			),
		key: `review-card-secondary-${reviewCard?.id ?? reviewCardId}`,
	})
	const notes = useAutoSave({
		initialValue: reviewCard?.notes ?? '',
		onSave: value =>
			void save('notes', value, 'Failed to update review-card notes'),
		key: `review-card-notes-${reviewCard?.id ?? reviewCardId}`,
	})

	return (
		<div {...stylex.props(styles.container)}>
			<main {...stylex.props(styles.main)}>
				{reviewCard && (
					<>
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
						<Textarea
							aria-label='Review-card notes'
							placeholder='Add notes'
							value={notes.value}
							onChange={notes.onChange}
							onBlur={notes.flush}
							xstyle={styles.notes}
						/>
					</>
				)}
			</main>
			<aside>
				<ReviewsSidebar />
			</aside>
		</div>
	)
}
