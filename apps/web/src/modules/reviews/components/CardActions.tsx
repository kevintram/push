import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Archive, ArrowUpRight, Ellipsis, Flag, Zap } from 'lucide-react'
import { useState } from 'react'

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
import { CardActionDialogs, type CardDialog } from './CardActionDialogs'

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
	showGoToCard = false,
	isMenuHoverRevealed = false,
	xstyle,
}: CardActionsProps) {
	const [dialog, setDialog] = useState<CardDialog>(null)
	const { toggleFlag, toggleRetire, toggleType } = useCardActions()

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
							xstyle={isMenuHoverRevealed && styles.hoverRevealed}
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

			<CardActionDialogs
				cards={[card]}
				dialog={dialog}
				onDialogChange={setDialog}
			/>
		</div>
	)
}
