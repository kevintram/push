import * as stylex from '@stylexjs/stylex'
import {
	Anvil,
	Check,
	CheckCheck,
	ChevronDown,
	Circle,
	Construction,
	Ellipsis,
	File,
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
import { fontSizes, iconSizes, spacing } from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'
import { getTodayAsString } from '~/utils/date'

import type { Rating, Review as ReviewModel } from '../types/review.types'
import { ReviewDatePicker } from './ReviewDatePicker'

const styles = stylex.create({
	contentContainer: {
		gridTemplateAreas: `
			'rating description'
			'empty footer'
		`,
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',

		backgroundColor: colors.bgSurfaceTransparent,
		cursor: 'pointer',

		borderWidth: 0,
	},
	rating: {
		gridColumnEnd: 'rating',
		gridColumnStart: 'rating',
		gridRowEnd: 'rating',
		gridRowStart: 'rating',

		alignSelf: 'center',

		paddingInline: spacing.xs,
	},
	description: {
		gridColumnEnd: 'description',
		gridColumnStart: 'description',
		gridRowEnd: 'description',
		gridRowStart: 'description',

		paddingBlock: spacing.xs,
		paddingInlineStart: spacing.sm,

		alignItems: 'center',
		columnGap: '6px',
		display: 'flex',
		minInlineSize: 0,

		fontSize: fontSizes.sm,

		backgroundColor: colors.bgSurfaceTransparent,
		color: colors.text,
		cursor: 'pointer',
	},
	descriptionText: {
		overflow: 'hidden',
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	notesIndicator: {
		blockSize: iconSizes.xs,
		color: colors.textSecondary,
		flexShrink: 0,
		inlineSize: iconSizes.xs,
	},
	footer: {
		gridColumnEnd: 'footer',
		gridColumnStart: 'footer',
		gridRowEnd: 'footer',
		gridRowStart: 'footer',

		paddingBlockStart: spacing.xs,
		paddingInlineStart: spacing.sm,

		alignItems: 'center',
		columnGap: spacing.md,
		display: 'flex',
		minInlineSize: 0,

		fontSize: fontSizes.sm,
	},
	spacer: {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
	},
	durability: {
		alignItems: 'center',
		color: colors.textSecondary,
		columnGap: spacing.xs,
		display: 'flex',
		whiteSpace: 'nowrap',
	},
	durabilityIcon: {
		blockSize: iconSizes.xs,
		inlineSize: iconSizes.xs,
	},
	positiveChange: { color: colors.textSuccess },
	negativeChange: { color: colors.textDanger },
	more: {
		flexShrink: 0,
		marginInlineStart: 'auto',
	},
	descriptionEditor: { minBlockSize: '96px' },
	notesEditor: { minBlockSize: '96px' },
})

const ratings = {
	miss: { label: 'Miss', Icon: X },
	hard: { label: 'Hard', Icon: Construction },
	good: { label: 'Good', Icon: Check },
	easy: { label: 'Easy', Icon: CheckCheck },
} as const

export function Review({ review }: { review: ReviewModel }) {
	const { isPending, mutateAsync } = useUpdateReview()
	const { isPending: isDeleting, mutateAsync: deleteReview } =
		useDeleteReview()
	const [isOpen, setIsOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const updateRating = useCallback(
		async (rating: Rating | null) => {
			const completionMatchesRating =
				rating === null
					? review.completed_at === null
					: review.completed_at !== null
			if (rating === review.rating && completionMatchesRating) return
			try {
				const completedAt =
					rating === null
						? null
						: ((review.completed_at as DateString | null) ??
							getTodayAsString())
				await mutateAsync({
					id: review.id,
					rating,
					completed_at: completedAt,
				})
			} catch {
				toast.error('Failed to update review rating')
			}
		},
		[mutateAsync, review.completed_at, review.id, review.rating],
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

	const rating = review.rating === null ? null : ratings[review.rating]
	const RatingIcon = rating?.Icon ?? Circle
	const description = review.description.trim()
	const hasNotes = review.notes.trim().length > 0
	const stabilityAfter =
		review.stability_after === null
			? null
			: Math.round(review.stability_after)
	const stabilityDelta =
		review.stability_before === null || review.stability_after === null
			? null
			: Math.round(review.stability_after - review.stability_before)
	const effectiveDate = (review.completed_at ??
		review.scheduled_at) as DateString | null
	const stabilityChange =
		stabilityDelta === null
			? 'new'
			: `${stabilityDelta >= 0 ? '+' : ''}${stabilityDelta}`
	const stabilityChangeStyle =
		stabilityDelta === null || stabilityDelta >= 0
			? styles.positiveChange
			: styles.negativeChange

	const updateDate = useCallback(
		async (value: DateString | null) => {
			try {
				if (review.completed_at !== null) {
					await mutateAsync({
						id: review.id,
						completed_at: value,
						...(value === null ? { rating: null } : {}),
					})
				} else {
					await mutateAsync({ id: review.id, scheduled_at: value })
				}
			} catch {
				toast.error('Failed to update review date')
			}
		},
		[mutateAsync, review.completed_at, review.id],
	)

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
				<DialogTrigger
					nativeButton={false}
					render={<div />}
					{...stylex.props(styles.contentContainer)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger
							aria-label={rating?.label ?? 'Uncompleted'}
							onClick={event => event.stopPropagation()}
							onMouseDown={event => event.stopPropagation()}
							render={
								<Button
									size='micro'
									variant='ghost'
									xstyle={styles.rating}
								/>
							}
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
						<DropdownMenuContent
							onClick={event => event.stopPropagation()}
							onMouseDown={event => event.stopPropagation()}
						>
							<DropdownMenuRadioGroup
								value={review.rating ?? ''}
								onValueChange={value =>
									void updateRating(
										value === '' ? null : (value as Rating),
									)
								}
							>
								<DropdownMenuRadioItem
									value=''
									disabled={isPending}
									prefix={
										<Circle
											aria-hidden='true'
											size={iconSizes.sm}
										/>
									}
								>
									Uncompleted
								</DropdownMenuRadioItem>
								{Object.entries(ratings).map(
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
					<div {...stylex.props(styles.description)}>
						<span {...stylex.props(styles.descriptionText)}>
							{description || 'No description'}
						</span>
						{hasNotes && (
							<File
								aria-label='Has notes'
								{...stylex.props(styles.notesIndicator)}
							/>
						)}
					</div>
					<div {...stylex.props(styles.footer)}>
						<ReviewDatePicker
							disabled={isPending}
							isCompleted={review.completed_at !== null}
							onChange={updateDate}
							value={effectiveDate}
						/>
						{stabilityAfter !== null && (
							<span {...stylex.props(styles.durability)}>
								<Anvil
									aria-hidden='true'
									{...stylex.props(styles.durabilityIcon)}
								/>
								<span>{stabilityAfter}d</span>
								<span {...stylex.props(stabilityChangeStyle)}>
									({stabilityChange})
								</span>
							</span>
						)}
						<div {...stylex.props(styles.spacer)} />
						<DropdownMenu>
							<DropdownMenuTrigger
								onClick={event => event.stopPropagation()}
								onMouseDown={event => event.stopPropagation()}
								render={
									<Button.Icon
										aria-label='Review actions'
										size='micro'
										variant='ghost'
										xstyle={styles.more}
									/>
								}
							>
								<Ellipsis
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='end'
								onClick={event => event.stopPropagation()}
								onMouseDown={event => event.stopPropagation()}
							>
								<DropdownMenuItem
									disabled={isDeleting}
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash2 aria-hidden='true' size={16} />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
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
