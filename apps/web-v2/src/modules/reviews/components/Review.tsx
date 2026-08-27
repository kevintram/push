import * as stylex from '@stylexjs/stylex'
import { Ellipsis, File, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	Dialog,
	DialogTrigger,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import { reviewColors } from '~/styles/colors/components.stylex'
import {
	fontSizes,
	iconSizes,
	layout,
	radii,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { useReviewActions } from '../hooks/useReviewActions'
import { useReviewField } from '../hooks/useReviewField'
import type { Review as ReviewModel } from '../types/review.types'
import { RatingPicker } from './RatingPicker'
import { ReviewDatePicker } from './ReviewDatePicker'
import { ReviewDialog } from './ReviewDialog'
import { ReviewDurability } from './ReviewDurability'

const styles = stylex.create({
	contentContainer: {
		gridTemplateAreas: `
			'rating description'
			'empty footer'
		`,
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto',
		position: 'relative',

		borderRadius: radii.lg,
		marginInline: `calc(${layout.rowBleed} * -1)`,
		paddingInline: layout.rowBleed,
		backgroundColor: {
			default: reviewColors.rowBackground,
			':hover': reviewColors.rowBackgroundHover,
		},
		cursor: 'pointer',
	},
	rating: {
		gridColumnEnd: 'rating',
		gridColumnStart: 'rating',
		gridRowEnd: 'rating',
		gridRowStart: 'rating',

		alignSelf: 'center',
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
		textAlign: 'start',

		backgroundColor: reviewColors.notesButtonBackground,
		color: reviewColors.notesButtonForeground,
		cursor: 'pointer',

		borderWidth: 0,

		// stretched link trick
		'::after': {
			inset: 0,
			content: '""',
			position: 'absolute',
		},
	},
	raised: {
		position: 'relative',
		zIndex: 1,
	},
	descriptionText: {
		overflow: 'hidden',
		minInlineSize: 0,
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	notesIndicator: {
		blockSize: iconSizes.md,
		color: reviewColors.notesIndicatorForeground,
		flexShrink: 0,
		inlineSize: iconSizes.md,
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
	more: {
		flexShrink: 0,
		marginInlineStart: 'auto',
	},
})

type ReviewProps = {
	review: ReviewModel
}

export function Review({ review }: ReviewProps) {
	const [isOpen, setIsOpen] = useState(false)

	const {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting,
		setDate,
		setIsDeleteDialogOpen,
		setRating,
	} = useReviewActions(review)

	const descriptionField = useReviewField({
		errorMessage: 'Failed to update review description',
		field: 'description',
		reviewId: review._id,
		value: review.description,
	})
	const notesField = useReviewField({
		errorMessage: 'Failed to update review notes',
		field: 'notes',
		reviewId: review._id,
		value: review.notes,
	})
	const handleOpenChange = (open: boolean) => {
		if (!open) {
			descriptionField.flush()
			notesField.flush()
		}
		setIsOpen(open)
	}

	const description = review.description.trim()
	const hasNotes = review.notes.trim().length > 0

	return (
		<>
			<Dialog open={isOpen} onOpenChange={handleOpenChange}>
				<div {...stylex.props(styles.contentContainer)}>
					<RatingPicker
						onSetRating={setRating}
						rating={review.rating}
						xstyle={[styles.rating, styles.raised]}
					/>
					<DialogTrigger {...stylex.props(styles.description)}>
						<span {...stylex.props(styles.descriptionText)}>
							{description || 'No description'}
						</span>
						{hasNotes && (
							<File
								aria-label='Has notes'
								{...stylex.props(styles.notesIndicator)}
							/>
						)}
					</DialogTrigger>
					<div {...stylex.props(styles.footer)}>
						<div {...stylex.props(styles.raised)}>
							<ReviewDatePicker
								isCompleted={review.rating !== undefined}
								onChange={setDate}
								size='micro'
								value={
									(review.date ?? null) as DateString | null
								}
							/>
						</div>
						<div {...stylex.props(styles.raised)}>
							<ReviewDurability review={review} size='micro' />
						</div>
						<div {...stylex.props(styles.spacer)} />
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button.Icon
										aria-label='Review actions'
										shape='round'
										size='micro'
										variant='ghost'
										xstyle={[styles.more, styles.raised]}
									/>
								}
							>
								<Ellipsis
									aria-hidden='true'
									size={iconSizes.md}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onClick={() => setIsDeleteDialogOpen(true)}
								>
									<Trash2
										aria-hidden='true'
										size={iconSizes.md}
									/>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<ReviewDialog
					descriptionField={descriptionField}
					isOpen={isOpen}
					notesField={notesField}
					onDelete={() => setIsDeleteDialogOpen(true)}
					onSetDate={setDate}
					onSetRating={setRating}
					review={review}
				/>
			</Dialog>

			<DeleteConfirmationDialog
				description='This review will be permanently deleted.'
				isPending={isDeleting}
				onConfirm={confirmDelete}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review?'
			/>
		</>
	)
}
