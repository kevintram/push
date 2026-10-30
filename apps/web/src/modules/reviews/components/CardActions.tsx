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
})

type CardActionsProps = {
	card: Card
	showGoToCard?: boolean
	/** Styles for the menu trigger, such as revealing it on hover. */
	menuTriggerXstyle?: stylex.StyleXStyles
	xstyle?: stylex.StyleXStyles
}

export function CardActions({
	card,
	showGoToCard = false,
	menuTriggerXstyle,
	xstyle,
}: CardActionsProps) {
	const [dialog, setDialog] = useState<'move' | 'delete' | null>(null)
	const { isDeleting, remove, toggleFlag, toggleRetire, toggleType } =
		useCardActions()
	const closeOnDismiss = (open: boolean) => {
		if (!open) setDialog(null)
	}

	const isFlashcard = card.type === 'flashcard'
	const isFlagged = card.flaggedAt !== undefined
	const isRetired = card.retiredAt !== undefined

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
							xstyle={menuTriggerXstyle}
						/>
					}
				>
					<Ellipsis aria-hidden='true' size={iconSizes.sm} />
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end'>
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
						onClick={() => toggleType([card])}
					>
						{isFlashcard
							? 'Remove as flashcard'
							: 'Mark as flashcard'}
					</DropdownMenuItem>
					<DropdownMenuItem
						icon={
							<Flag
								aria-hidden='true'
								size={iconSizes.sm}
								{...stylex.props(isFlagged && styles.flagOn)}
							/>
						}
						onClick={() => toggleFlag([card])}
					>
						{isFlagged ? 'Unflag' : 'Flag'}
					</DropdownMenuItem>
					<DropdownMenuItem
						icon={
							<Archive
								aria-hidden='true'
								size={iconSizes.sm}
								{...stylex.props(isRetired && styles.retiredOn)}
							/>
						}
						onClick={() => toggleRetire([card])}
					>
						{isRetired ? 'Unretire' : 'Retire'}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setDialog('move')}>
						Move
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={() => setDialog('delete')}>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{dialog === 'move' ? (
				<MoveCardDialog cards={[card]} onOpenChange={closeOnDismiss} />
			) : null}

			<DeleteConfirmationDialog
				description='This card and its content will be permanently deleted.'
				isPending={isDeleting}
				// Leave the dialog open on failure so the toast has context.
				onConfirm={() => remove([card], () => setDialog(null))}
				onOpenChange={closeOnDismiss}
				open={dialog === 'delete'}
				title='Delete card?'
			/>
		</div>
	)
}
