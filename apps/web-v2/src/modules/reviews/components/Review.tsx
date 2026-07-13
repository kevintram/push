import * as stylex from '@stylexjs/stylex'
import { Check, CheckCheck, Circle, Construction, X } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogTrigger, Textarea } from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useUpdateReview } from '~/modules/reviews/api/updateReview'

import type { Review as ReviewModel } from '../types/review.types'

const styles = stylex.create({
	contentContainer: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',

		alignItems: 'center',
		justifyItems: 'start',

		backgroundColor: 'transparent',

		borderWidth: 0,
	},
	rating: {
		gridColumn: '1',
		gridRow: '1',
	},
	description: {
		gridColumn: '2',
		gridRow: '1',
	},
	footer: {
		gridColumn: '2',
		gridRow: '2',
	},
	descriptionEditor: { minBlockSize: '96px' },
	notesEditor: { minBlockSize: '96px' },
})

const ratingDetails = {
	miss: { label: 'Miss', Icon: X },
	hard: { label: 'Hard', Icon: Construction },
	good: { label: 'Good', Icon: Check },
	easy: { label: 'Easy', Icon: CheckCheck },
} as const

function formatDate(value: string | null) {
	if (value === null) return 'Unscheduled'
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${value}T00:00:00Z`))
}

export function Review({ review }: { review: ReviewModel }) {
	const { mutateAsync } = useUpdateReview()
	const save = useCallback(
		async (field: 'description' | 'notes', value: string) => {
			if (value === review[field]) return
			try {
				await mutateAsync({ id: review.id, [field]: value })
			} catch {
				toast.error(`Failed to update review ${field}`)
			}
		},
		[mutateAsync, review],
	)
	const descriptionEditor = useAutoSave({
		initialValue: review.description,
		onSave: value => void save('description', value),
		key: `review-description-${review.id}`,
	})
	const notesEditor = useAutoSave({
		initialValue: review.notes,
		onSave: value => void save('notes', value),
		key: `review-notes-${review.id}`,
	})

	const rating = review.rating === null ? null : ratingDetails[review.rating]
	const RatingIcon = rating?.Icon ?? Circle
	const description = review.description.trim()
	const stabilityAfter =
		review.stability_after === null
			? null
			: Math.round(review.stability_after)
	const stabilityDelta =
		review.stability_before === null || review.stability_after === null
			? null
			: Math.round(review.stability_after - review.stability_before)
	const effectiveDate = review.completed_at ?? review.scheduled_at
	const stabilityChange =
		stabilityAfter === null
			? null
			: stabilityDelta === null
				? `${stabilityAfter}d (new)`
				: `${stabilityAfter}d (${stabilityDelta >= 0 ? '+' : ''}${stabilityDelta})`

	return (
		<Dialog>
			<DialogTrigger {...stylex.props(styles.contentContainer)}>
				<div
					aria-label={rating?.label ?? 'Uncompleted'}
					{...stylex.props(styles.rating)}
				>
					<RatingIcon aria-hidden='true' />
				</div>
				<div {...stylex.props(styles.description)}>
					{description || 'No description'}
				</div>
				<div {...stylex.props(styles.footer)}>
					{formatDate(effectiveDate)}
					{stabilityChange ? ` · ${stabilityChange}` : null}
				</div>
			</DialogTrigger>

			<DialogContent>
				<Textarea
					aria-label='Review description'
					placeholder='Add a review description'
					value={descriptionEditor.value}
					onChange={descriptionEditor.onChange}
					onBlur={descriptionEditor.flush}
					xstyle={styles.descriptionEditor}
				/>
				<Textarea
					aria-label='Review notes'
					placeholder='Add review notes'
					value={notesEditor.value}
					onChange={notesEditor.onChange}
					onBlur={notesEditor.flush}
					xstyle={styles.notesEditor}
				/>
			</DialogContent>
		</Dialog>
	)
}
