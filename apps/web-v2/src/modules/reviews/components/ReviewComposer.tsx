import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import type { FormEvent, KeyboardEvent } from 'react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button, Textarea } from '~/components/ui'
import { reviewComposerColors } from '~/styles/colors/components.stylex'
import { fontSizes, fontWeights, radii, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { todayIso } from '~/utils/date'

import { useCreateReview } from '../api/reviewQueries'
import type { Rating } from '../types/review.types'
import { RatingPicker } from './RatingPicker'
import { ReviewDatePicker } from './ReviewDatePicker'

const styles = stylex.create({
	composer: {
		columnGap: spacing.sm,
		rowGap: spacing.sm,

		padding: spacing.md,
		marginInline: `calc(${spacing.md} * -1)`,

		borderRadius: radii.xl,
		backgroundColor: reviewComposerColors.containerBackground,
		boxShadow: `0 4px 16px ${reviewComposerColors.containerShadow}`,

		display: 'grid',
		gridTemplateColumns: 'max-content minmax(0, 1fr)',
		gridTemplateRows: 'auto auto',
		inlineSize: `calc(100% + (${spacing.md} * 2))`,
		minInlineSize: 0,
	},
	rail: {
		alignItems: 'flex-start',
		display: 'flex',
		gridColumnEnd: '2',
		gridColumnStart: '1',
		gridRowEnd: '3',
		gridRowStart: '1',
		minInlineSize: 0,
	},
	ratingControl: {
		borderRadius: radii.md,
		backgroundColor: reviewComposerColors.containerBackground,
	},
	editor: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '2',
		gridRowStart: '1',
		minInlineSize: 0,
	},
	description: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		marginBlockStart: '4px',
		maxBlockSize: 'calc(1.4em * 6)',
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	notes: {
		borderRadius: radii.xs,
		borderStyle: 'none',
		fontSize: fontSizes.sm,
		fontWeight: fontWeights.medium,
		lineHeight: 1.4,
		minBlockSize: '5rem',
		overflowWrap: 'anywhere',
		overflowX: 'hidden',
		overflowY: 'auto',
	},
	footer: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexWrap: 'wrap',
		gridColumnEnd: '3',
		gridColumnStart: '2',
		gridRowEnd: '3',
		gridRowStart: '2',
		justifyContent: 'space-between',
		minInlineSize: 0,
		rowGap: spacing.xs,
	},
	footerMetadata: {
		alignItems: 'center',
		columnGap: spacing.md,
		display: 'flex',
		flexGrow: 1,
		flexShrink: 1,
		flexWrap: 'wrap',
		minInlineSize: 0,
		rowGap: spacing.xs,
	},
	footerActions: {
		alignItems: 'center',
		columnGap: spacing.sm,
		display: 'flex',
		flexShrink: 0,
		marginInlineStart: 'auto',
		whiteSpace: 'nowrap',
	},
})

type ReviewDraft = {
	description: string
	notes: string
	rating: Rating | null
	date: DateString | null
}

const defaultDraft: ReviewDraft = {
	description: '',
	notes: '',
	rating: null,
	date: null,
}

type ReviewComposerProps = {
	cardId: Id<'cards'>
}

export function ReviewComposer({ cardId }: ReviewComposerProps) {
	const [draft, setDraft] = useState<ReviewDraft>(defaultDraft)
	const createReview = useCreateReview()
	const isDirty =
		draft.description !== '' ||
		draft.notes !== '' ||
		draft.rating !== null ||
		draft.date !== null
	const isPending = createReview.isPending
	const isSubmitDisabled = !isDirty || isPending

	const setDescription = (description: string) =>
		setDraft(previous => ({ ...previous, description }))
	const setNotes = (notes: string) =>
		setDraft(previous => ({ ...previous, notes }))
	const setRating = (rating: Rating | null) =>
		setDraft(previous => ({
			...previous,
			rating,
			date:
				rating !== null && previous.rating === null
					? todayIso()
					: previous.date,
		}))
	const setDate = (date: DateString | null) =>
		setDraft(previous => ({ ...previous, date }))

	const resetDraft = () => {
		setDraft(defaultDraft)
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (isSubmitDisabled) return

		createReview.mutate(
			{
				cardId,
				description: draft.description,
				notes: draft.notes,
				...(draft.rating === null ? {} : { rating: draft.rating }),
				...(draft.date === null ? {} : { date: draft.date }),
			},
			{
				onError: () => toast.error('Failed to create review'),
				onSuccess: resetDraft,
			},
		)
	}

	const handleTextareaKeyDown = (
		event: KeyboardEvent<HTMLTextAreaElement>,
	) => {
		if (
			event.key !== 'Enter' ||
			(!event.metaKey && !event.ctrlKey) ||
			isSubmitDisabled
		) {
			return
		}

		event.preventDefault()
		event.currentTarget.form?.requestSubmit()
	}

	return (
		<form
			aria-label='Add review'
			onSubmit={handleSubmit}
			{...stylex.props(styles.composer)}
		>
			<aside {...stylex.props(styles.rail)}>
				<div {...stylex.props(styles.ratingControl)}>
					<RatingPicker
						disabled={isPending}
						onSetRating={setRating}
						rating={draft.rating ?? undefined}
					/>
				</div>
			</aside>
			<div {...stylex.props(styles.editor)}>
				<Textarea
					aria-label='Review description'
					disabled={isPending}
					onChange={event => setDescription(event.target.value)}
					onKeyDown={handleTextareaKeyDown}
					placeholder='Add a review...'
					value={draft.description}
					xstyle={styles.description}
				/>
				<Textarea
					aria-label='Review notes'
					disabled={isPending}
					onChange={event => setNotes(event.target.value)}
					onKeyDown={handleTextareaKeyDown}
					placeholder='Notes'
					value={draft.notes}
					xstyle={styles.notes}
				/>
			</div>
			<footer {...stylex.props(styles.footer)}>
				<div {...stylex.props(styles.footerMetadata)}>
					<ReviewDatePicker
						disabled={isPending}
						isCompleted={draft.rating !== null}
						onChange={setDate}
						size='medium'
						value={draft.date}
					/>
				</div>
				<div {...stylex.props(styles.footerActions)}>
					{isDirty && (
						<Button
							disabled={isPending}
							onClick={resetDraft}
							shape='round'
							type='button'
							variant='ghost'
						>
							Cancel
						</Button>
					)}
					<Button
						shape='round'
						disabled={isSubmitDisabled}
						type='submit'
					>
						Add
					</Button>
				</div>
			</footer>
		</form>
	)
}
