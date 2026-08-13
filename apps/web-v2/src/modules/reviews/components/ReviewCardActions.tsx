import * as stylex from '@stylexjs/stylex'
import { Ellipsis, Flag, Trash2, Zap } from 'lucide-react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { colors } from '~/styles/colors.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { useReviewCardActions } from '../hooks/useReviewCardActions'
import type { ReviewCard } from '../types/review.types'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
	flashcardOn: {
		fill: colors.iconFlashcardActive,
		color: colors.iconFlashcardActive,
	},
	flagOn: {
		fill: colors.iconFlagActive,
		color: colors.iconFlagActive,
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
								aria-label='Unflashcard'
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
					<TooltipContent>Deflashcardify</TooltipContent>
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
						{isFlashcard ? 'Deflashcardify' : 'Flashcardify'}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={toggleFlag}>
						<Flag
							aria-hidden='true'
							size={iconSizes.md}
							{...(isFlagged ? stylex.props(styles.flagOn) : {})}
						/>
						{isFlagged ? 'Unflag' : 'Flag'}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						<Trash2 aria-hidden='true' size={iconSizes.md} />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

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
