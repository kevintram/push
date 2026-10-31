import * as stylex from '@stylexjs/stylex'
import { HotkeysProvider } from '@tanstack/react-hotkeys'
import { Archive, Ellipsis, Flag, Zap } from 'lucide-react'
import { useId, useState } from 'react'

import { DeleteConfirmationDialog } from '~/components/DeleteConfirmationDialog'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { hotkeyItemProps } from '~/modules/shortcuts/hotkeyItemProps'
import { iconSizes } from '~/styles/tokens.stylex'

import { useCardActions } from '../hooks/useCardActions'
import type { Card } from '../types/review.types'
import { CardActionHotkeys } from './CardActionHotkeys'
import { cardStatusStyles } from './cardStatusStyles'
import { MoveCardDialog } from './MoveCardDialog'

type CardMenuProps = {
	card: Card
	/**
	 * Also binds keys while the menu is closed, for the open card's page.
	 * List rows bind keys only inside their open menu.
	 */
	hasHotkeys?: boolean
	/** Styles for the menu trigger, such as revealing it on hover. */
	triggerXstyle?: stylex.StyleXStyles
}

/** A card's actions menu, with the dialogs its items open. */
export function CardMenu({
	card,
	hasHotkeys = false,
	triggerXstyle,
}: CardMenuProps) {
	const scope = `card-menu-${useId()}`
	const [isOpen, setIsOpen] = useState(false)
	const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
	const [dialog, setDialog] = useState<'move' | 'delete' | null>(null)
	const { isDeleting, remove, toggleFlag, toggleRetire, toggleType } =
		useCardActions()
	const closeOnDismiss = (open: boolean) => {
		if (!open) setDialog(null)
	}

	const isFlashcard = card.type === 'flashcard'
	const isFlagged = card.flaggedAt !== undefined
	const isRetired = card.retiredAt !== undefined
	const hotkeys = (
		<CardActionHotkeys
			onToggleFlag={() => toggleFlag([card])}
			onToggleRetire={() => toggleRetire([card])}
			onToggleType={() => toggleType([card])}
			onMove={() => setDialog('move')}
			onDelete={() => setDialog('delete')}
		/>
	)

	return (
		<>
			{hasHotkeys ? hotkeys : null}
			<DropdownMenu
				open={isOpen}
				onOpenChange={open => {
					// Preserve the menu while its dialog temporarily takes focus.
					if (dialog === null) setIsOpen(open)
				}}
			>
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
				<DropdownMenuContent ref={setMenuElement} align='end'>
					{/* This menu owns the keys until a dialog takes focus. Capture
					them on the popup before its typeahead handles letter keys. */}
					<HotkeysProvider
						scope={scope}
						exclusive
						enabled={isOpen && dialog === null}
						defaultOptions={{
							hotkey: { target: menuElement, capture: true },
						}}
					>
						{hotkeys}
					</HotkeysProvider>
					<DropdownMenuItem
						closeOnClick={false}
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
						{...hotkeyItemProps(appHotkeys.toggleCardType)}
					>
						{isFlashcard
							? 'Remove as flashcard'
							: 'Mark as flashcard'}
					</DropdownMenuItem>
					<DropdownMenuItem
						closeOnClick={false}
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
						{...hotkeyItemProps(appHotkeys.toggleFlag)}
					>
						{isFlagged ? 'Unflag' : 'Flag'}
					</DropdownMenuItem>
					<DropdownMenuItem
						closeOnClick={false}
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
						{...hotkeyItemProps(appHotkeys.toggleRetire)}
					>
						{isRetired ? 'Unretire' : 'Retire'}
					</DropdownMenuItem>
					<DropdownMenuItem
						closeOnClick={false}
						onClick={() => setDialog('move')}
						{...hotkeyItemProps(appHotkeys.moveCard)}
					>
						Move
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						closeOnClick={false}
						onClick={() => setDialog('delete')}
						{...hotkeyItemProps(appHotkeys.deleteCard)}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			{dialog === 'move' ? (
				<MoveCardDialog cards={[card]} onOpenChange={closeOnDismiss} />
			) : null}

			<DeleteConfirmationDialog
				description={
					<>
						This card and its reviews will be{' '}
						<strong>permanently</strong> deleted.
					</>
				}
				isPending={isDeleting}
				// Leave the dialog open on failure so the toast has context.
				onConfirm={() => remove([card], () => setDialog(null))}
				onOpenChange={closeOnDismiss}
				open={dialog === 'delete'}
				title={`Delete “${card.primaryText.trim() || 'Untitled card'}”?`}
			/>
		</>
	)
}
