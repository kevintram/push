import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import {
	Archive,
	ArrowUpRight,
	Ellipsis,
	Flag,
	FolderInput,
	Trash2,
	Zap,
} from 'lucide-react'
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
import { cardActionsColors } from '~/styles/colors/components.stylex'
import { iconSizes, spacing } from '~/styles/tokens.stylex'

import { useCardActions } from '../hooks/useCardActions'
import type { Card } from '../types/review.types'
import { MoveCardDialog } from './MoveCardDialog'

const styles = stylex.create({
	container: {
		gap: spacing.xs,
		alignItems: 'center',
		display: 'flex',
		flexShrink: 0,
	},
	flashcardOn: {
		fill: cardActionsColors.flashcardSelectedForeground,
		color: cardActionsColors.flashcardSelectedForeground,
	},
	flagOn: {
		fill: cardActionsColors.flagSelectedForeground,
		color: cardActionsColors.flagSelectedForeground,
	},
	// Stroke only, unlike `flagOn` and `flashcardOn`. `Flag` and `Zap` fill into
	// legible solid shapes; a filled `Archive` collapses into a blob that reads
	// like the neighbouring trash icon.
	retiredOn: {
		color: cardActionsColors.retiredSelectedForeground,
	},
})

type CardActionsProps = {
	card: Card
	showGoToCard?: boolean
	xstyle?: stylex.StyleXStyles
}

export function CardActions({
	card,
	showGoToCard = false,
	xstyle,
}: CardActionsProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const {
		confirmDelete,
		isDeleteDialogOpen,
		isDeleting,
		setIsDeleteDialogOpen,
		toggleFlag,
		toggleRetire,
		toggleType,
	} = useCardActions(card)

	const isFlashcard = card.type === 'flashcard'
	const isFlagged = card.flaggedAt !== undefined
	const isRetired = card.retiredAt !== undefined

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			{showGoToCard ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button.Icon
								aria-label='Go to card'
								shape='round'
								variant='ghost'
								size='small'
								nativeButton={false}
								render={
									<Link
										to='/cards/$cardId'
										params={{ cardId: card._id }}
									/>
								}
							>
								<ArrowUpRight
									aria-hidden='true'
									size={iconSizes.md}
								/>
							</Button.Icon>
						}
					/>
					<TooltipContent>Go to card</TooltipContent>
				</Tooltip>
			) : null}
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
			{isRetired ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button.Icon
								aria-label='Unretire'
								shape='round'
								variant='ghost'
								size='small'
								onClick={toggleRetire}
							>
								<Archive
									aria-hidden='true'
									size={iconSizes.md}
									{...stylex.props(styles.retiredOn)}
								/>
							</Button.Icon>
						}
					/>
					<TooltipContent>Unretire</TooltipContent>
				</Tooltip>
			) : null}

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button.Icon
							aria-label='Card actions'
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
					<DropdownMenuItem onClick={toggleRetire}>
						<Archive
							aria-hidden='true'
							size={iconSizes.md}
							{...(isRetired
								? stylex.props(styles.retiredOn)
								: {})}
						/>
						{isRetired ? 'Unretire' : 'Retire'}
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
				<MoveCardDialog
					onOpenChange={setIsMoveDialogOpen}
					card={card}
				/>
			) : null}

			<DeleteConfirmationDialog
				description='This card and its content will be permanently deleted.'
				isPending={isDeleting}
				onConfirm={confirmDelete}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title='Delete card?'
			/>
		</div>
	)
}
