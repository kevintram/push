import * as stylex from '@stylexjs/stylex'
import { Archive, Ellipsis, Flag, Zap } from 'lucide-react'
import { useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

import { useCardActions } from '../hooks/useCardActions'
import type { Card } from '../types/review.types'
import { cardStatusStyles } from './cardStatusStyles'
import { MoveCardDialog } from './MoveCardDialog'

type CardMenuProps = {
	card: Card
	/** Styles for the menu trigger, such as revealing it on hover. */
	triggerXstyle?: stylex.StyleXStyles
}

/** A card's actions menu, with the dialogs its items open. */
export function CardMenu({ card, triggerXstyle }: CardMenuProps) {
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
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label='Card actions'
							iconOnly
							shape='round'
							variant='ghost'
							size='small'
							xstyle={triggerXstyle}
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
									isFlashcard && cardStatusStyles.flashcardOn,
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
								{...stylex.props(
									isFlagged && cardStatusStyles.flagOn,
								)}
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
								{...stylex.props(
									isRetired && cardStatusStyles.retiredOn,
								)}
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
		</>
	)
}
