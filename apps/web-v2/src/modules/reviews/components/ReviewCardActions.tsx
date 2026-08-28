import * as stylex from '@stylexjs/stylex'
import { Ellipsis, Flag, FolderInput, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { reviewCardActionsColors } from '~/styles/colors/components.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { useReviewCardActions } from '../hooks/useReviewCardActions'
import type { ReviewCard } from '../types/review.types'
import { MoveReviewCardDialog } from './MoveReviewCardDialog'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
	flashcardOn: {
		fill: reviewCardActionsColors.flashcardSelectedForeground,
		color: reviewCardActionsColors.flashcardSelectedForeground,
	},
	flagOn: {
		fill: reviewCardActionsColors.flagSelectedForeground,
		color: reviewCardActionsColors.flagSelectedForeground,
	},
})

type ReviewCardActionsProps = {
	reviewCard: ReviewCard
	xstyle?: stylex.StyleXStyles
}

export function ReviewCardActions({
	reviewCard,
	xstyle,
}: ReviewCardActionsProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting,
		setIsDeleteDialogOpen,
		toggleFlag,
		toggleType,
	} = useReviewCardActions(reviewCard)

	const isFlashcard = reviewCard.type === 'flashcard'
	const isFlagged = reviewCard.flaggedAt !== undefined

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			{isFlashcard ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button.Icon
								aria-label='Remove as flashcard'
								shape='round'
								variant='ghost'
								size='small'
								onClick={toggleType}
							>
								<Zap
									aria-hidden='true'
									size={iconSizes.md}
									{...stylex.props(styles.flashcardOn)}
								/>
							</Button.Icon>
						}
					/>
					<TooltipContent>Remove as flashcard</TooltipContent>
				</Tooltip>
			) : null}
			{isFlagged ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button.Icon
								aria-label='Unflag'
								shape='round'
								variant='ghost'
								size='small'
								onClick={toggleFlag}
							>
								<Flag
									aria-hidden='true'
									size={iconSizes.md}
									{...stylex.props(styles.flagOn)}
								/>
							</Button.Icon>
						}
					/>
					<TooltipContent>Unflag</TooltipContent>
				</Tooltip>
			) : null}

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button.Icon
							aria-label='Review card actions'
							shape='round'
							variant='ghost'
							size='small'
						/>
					}
				>
					<Ellipsis aria-hidden='true' size={iconSizes.md} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					<DropdownMenuItem onClick={toggleType}>
						<Zap
							aria-hidden='true'
							size={iconSizes.md}
							{...(isFlashcard
								? stylex.props(styles.flashcardOn)
								: {})}
						/>
						{isFlashcard
							? 'Remove as flashcard'
							: 'Mark as flashcard'}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={toggleFlag}>
						<Flag
							aria-hidden='true'
							size={iconSizes.md}
							{...(isFlagged ? stylex.props(styles.flagOn) : {})}
						/>
						{isFlagged ? 'Unflag' : 'Flag'}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
						<FolderInput aria-hidden='true' size={iconSizes.md} />
						Move
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						<Trash2 aria-hidden='true' size={iconSizes.md} />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isMoveDialogOpen ? (
				<MoveReviewCardDialog
					onOpenChange={setIsMoveDialogOpen}
					reviewCard={reviewCard}
				/>
			) : null}

			<DeleteConfirmationDialog
				description='This review card and its content will be permanently deleted.'
				isPending={isDeleting}
				onConfirm={confirmDelete}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete review card?'
			/>
		</div>
	)
}
