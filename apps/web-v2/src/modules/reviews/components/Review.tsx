import * as stylex from '@stylexjs/stylex'
import {
	Check,
	CheckCheck,
	ChevronDown,
	Circle,
	Construction,
	Ellipsis,
	Trash2,
	X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Textarea,
} from '~/components/ui'
import { useAutoSave } from '~/hooks/useAutoSave'
import { useDeleteReview } from '~/modules/reviews/api/deleteReview'
import { useUpdateReview } from '~/modules/reviews/api/updateReview'
import { colors } from '~/styles/colors.stylex'
import { fontSizes, iconSizes } from '~/styles/tokens.stylex'

import type { Rating, Review as ReviewModel } from '../types/review.types'

const styles = stylex.create({
	contentContainer: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',

		alignItems: 'center',
		justifyItems: 'start',

		backgroundColor: colors.bgSurfaceTransparent,

		borderWidth: 0,
	},
	rating: {
		gridColumn: '1',
		gridRow: '1',
	},
	ratingTrigger: {
		padding: 0,

		gap: '2px',
		alignItems: 'center',
		display: 'inline-flex',

		font: 'inherit',
		borderColor: 'transparent',
		borderStyle: 'solid',
		borderWidth: 0,
		backgroundColor: colors.bgSurfaceTransparent,
		color: 'inherit',
		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
	},
	description: {
		gridColumn: '2',
		gridRowEnd: '-1',
		gridRowStart: '1',

		padding: 0,

		alignContent: 'center',
		display: 'grid',
		gridTemplateRows: 'auto auto',
		justifyItems: 'start',
		minInlineSize: 0,

		font: 'inherit',
		fontSize: fontSizes.sm,

		borderColor: 'transparent',
		borderStyle: 'solid',
		borderWidth: 0,
		backgroundColor: colors.bgSurfaceTransparent,
		color: colors.text,
		cursor: 'pointer',
		outlineColor: {
			default: 'transparent',
			':focus-visible': colors.borderFocus,
		},
		outlineOffset: '2px',
		outlineStyle: 'solid',
		outlineWidth: '2px',
		textAlign: 'start',
	},
	footer: {
		gridRow: '2',
	},
	dialogHeader: {
		justifyContent: 'flex-end',
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
	const { isPending, mutateAsync } = useUpdateReview()
	const { isPending: isDeleting, mutateAsync: deleteReview } =
		useDeleteReview()
	const [isOpen, setIsOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const updateRating = useCallback(
		async (rating: Rating) => {
			if (rating === review.rating) return
			try {
				await mutateAsync({ id: review.id, rating })
			} catch {
				toast.error('Failed to update review rating')
			}
		},
		[mutateAsync, review.id, review.rating],
	)
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

	const handleDelete = async () => {
		try {
			await deleteReview(review.id)
			setIsDeleteDialogOpen(false)
			setIsOpen(false)
		} catch {
			toast.error('Failed to delete review')
		}
	}

	return (
		<>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<div {...stylex.props(styles.contentContainer)}>
					<div
						aria-label={rating?.label ?? 'Uncompleted'}
						{...stylex.props(styles.rating)}
					>
						<DropdownMenu>
							<DropdownMenuTrigger
								{...stylex.props(styles.ratingTrigger)}
							>
								<RatingIcon
									aria-hidden='true'
									size={iconSizes.sm}
								/>
								<ChevronDown
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup
									value={review.rating ?? ''}
									onValueChange={value =>
										void updateRating(value as Rating)
									}
								>
									{Object.entries(ratingDetails).map(
										([value, { label, Icon }]) => (
											<DropdownMenuRadioItem
												key={value}
												value={value}
												disabled={isPending}
												prefix={
													<Icon
														aria-hidden='true'
														size={iconSizes.sm}
													/>
												}
											>
												{label}
											</DropdownMenuRadioItem>
										),
									)}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<DialogTrigger {...stylex.props(styles.description)}>
						{description || 'No description'}
						<div {...stylex.props(styles.footer)}>
							{formatDate(effectiveDate)}
							{stabilityChange ? ` · ${stabilityChange}` : null}
						</div>
					</DialogTrigger>
				</div>

				<DialogContent>
					<DialogHeader xstyle={styles.dialogHeader}>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button.Icon
										aria-label='Review actions'
										variant='ghost'
									/>
								}
							>
								<Ellipsis aria-hidden='true' />
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									disabled={isDeleting}
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash2 aria-hidden='true' size={16} />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</DialogHeader>
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
			<DeleteConfirmationDialog
				description='This will delete this review.'
				isPending={isDeleting}
				onConfirm={() => void handleDelete()}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review?'
			/>
		</>
	)
}
