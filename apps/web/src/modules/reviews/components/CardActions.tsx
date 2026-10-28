import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Archive, ArrowUpRight, Ellipsis, Flag, Zap } from 'lucide-react'
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
import { amber, orange, violet } from '~/styles/colors/colorsPrimitive.stylex'
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
		fill: amber.s400,
		color: amber.s400,
	},
	flagOn: {
		fill: orange.s500,
		color: orange.s500,
	},
	// Stroke only, unlike `flagOn` and `flashcardOn`. `Flag` and `Zap` fill into
	// legible solid shapes; a filled `Archive` collapses into a blob that reads
	// like the neighbouring trash icon.
	retiredOn: {
		color: violet.s400,
	},
	// Shown while the row is hovered, keyboard focused, or has its menu open.
	// Always shown on touch, where there is no hover to reveal it.
	hoverRevealed: {
		opacity: {
			default: null,
			'@media (hover: hover)': {
				default: 0,
				[stylex.when.ancestor(':has(:focus-visible)')]: 1,
				[stylex.when.ancestor(':has([data-popup-open])')]: 1,
				[stylex.when.ancestor(':hover')]: 1,
			},
		},
	},
})

type CardActionsProps = {
	card: Card
	/**
	 * The selected cards. When `card` is one of several, the menu acts on all
	 * of them; the quick toggles beside it still act on `card` alone.
	 */
	selection?: ReadonlyArray<Card>
	showGoToCard?: boolean
	/**
	 * Hide the menu trigger until an ancestor marked with
	 * `stylex.defaultMarker()` is hovered or focused.
	 */
	isMenuHoverRevealed?: boolean
	xstyle?: stylex.StyleXStyles
}

export function CardActions({
	card,
	selection,
	showGoToCard = false,
	isMenuHoverRevealed = false,
	xstyle,
}: CardActionsProps) {
	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const { isDeleting, remove, toggleFlag, toggleRetire, toggleType } =
		useCardActions()

	const isFlashcard = card.type === 'flashcard'
	const isFlagged = card.flaggedAt !== undefined
	const isRetired = card.retiredAt !== undefined

	const targets =
		selection &&
		selection.length > 1 &&
		selection.some(({ _id }) => _id === card._id)
			? selection
			: [card]
	const isBatch = targets.length > 1
	// Names the menu's action for a single card, or counts the cards.
	const label = (action: string) =>
		isBatch ? `${action} ${targets.length} cards` : action
	const areAllFlagged = targets.every(
		({ flaggedAt }) => flaggedAt !== undefined,
	)
	const areAllRetired = targets.every(
		({ retiredAt }) => retiredAt !== undefined,
	)

	return (
		<div {...stylex.props(styles.container, xstyle)}>
			{showGoToCard ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Go to card'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								nativeButton={false}
								render={
									<Link
										to='/cards/$cardId'
										params={{ cardId: card._id }}
										// Base UI marks non-native buttons as `button`.
										role='link'
									/>
								}
							>
								<ArrowUpRight
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							</Button>
						}
					/>
					<TooltipContent>Go to card</TooltipContent>
				</Tooltip>
			) : null}
			{isFlashcard ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Remove as flashcard'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								onClick={() => toggleType([card])}
							>
								<Zap
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(styles.flashcardOn)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Remove as flashcard</TooltipContent>
				</Tooltip>
			) : null}
			{isFlagged ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Unflag'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								onClick={() => toggleFlag([card])}
							>
								<Flag
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(styles.flagOn)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Unflag</TooltipContent>
				</Tooltip>
			) : null}
			{isRetired ? (
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label='Unretire'
								iconOnly
								shape='round'
								variant='ghost'
								size='small'
								onClick={() => toggleRetire([card])}
							>
								<Archive
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(styles.retiredOn)}
								/>
							</Button>
						}
					/>
					<TooltipContent>Unretire</TooltipContent>
				</Tooltip>
			) : null}

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label='Card actions'
							iconOnly
							shape='round'
							variant='ghost'
							size='small'
							xstyle={isMenuHoverRevealed && styles.hoverRevealed}
						/>
					}
				>
					<Ellipsis aria-hidden='true' size={iconSizes.sm} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
					{isBatch ? null : (
						<DropdownMenuItem
							icon={
								<Zap
									aria-hidden='true'
									size={iconSizes.sm}
									{...stylex.props(
										isFlashcard && styles.flashcardOn,
									)}
								/>
							}
							onClick={() => toggleType(targets)}
						>
							{isFlashcard
								? 'Remove as flashcard'
								: 'Mark as flashcard'}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						icon={
							<Flag
								aria-hidden='true'
								size={iconSizes.sm}
								{...stylex.props(
									areAllFlagged && styles.flagOn,
								)}
							/>
						}
						onClick={() => toggleFlag(targets)}
					>
						{label(areAllFlagged ? 'Unflag' : 'Flag')}
					</DropdownMenuItem>
					<DropdownMenuItem
						icon={
							<Archive
								aria-hidden='true'
								size={iconSizes.sm}
								{...stylex.props(
									areAllRetired && styles.retiredOn,
								)}
							/>
						}
						onClick={() => toggleRetire(targets)}
					>
						{label(areAllRetired ? 'Unretire' : 'Retire')}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setIsMoveDialogOpen(true)}>
						{label('Move')}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={() => setIsDeleteDialogOpen(true)}
					>
						{label('Delete')}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{isMoveDialogOpen ? (
				<MoveCardDialog
					onOpenChange={setIsMoveDialogOpen}
					cards={targets}
				/>
			) : null}

			<DeleteConfirmationDialog
				description={
					isBatch
						? 'These cards and their content will be permanently deleted.'
						: 'This card and its content will be permanently deleted.'
				}
				isPending={isDeleting}
				onConfirm={() =>
					// Leave the dialog open on failure so the toast has context.
					remove(targets, () => setIsDeleteDialogOpen(false))
				}
				onOpenChange={setIsDeleteDialogOpen}
				open={isDeleteDialogOpen}
				title={
					isBatch ? `Delete ${targets.length} cards?` : 'Delete card?'
				}
			/>
		</div>
	)
}
