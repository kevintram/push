import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { Archive, Ellipsis, Flag, FolderTree, Zap } from 'lucide-react'
import { useState } from 'react'

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
import { useConvertSectionsToCollections } from '~/modules/collections/api/sectionQueries'
import { cardStatusStyles } from '~/modules/reviews/components/cardStatusStyles'
import { useCardActions } from '~/modules/reviews/hooks/useCardActions'
import { appHotkeys } from '~/modules/shortcuts/appHotkeys'
import { ariaKeyShortcuts } from '~/modules/shortcuts/ariaKeyShortcuts'
import { ShortcutKeys } from '~/modules/shortcuts/components/ShortcutKeys'
import { hotkeyItemProps } from '~/modules/shortcuts/hotkeyItemProps'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

import { SelectionActionHotkeys } from './SelectionActionHotkeys'
import { countItems, type SelectionContents } from './selectionContents'
import { type SelectionDialog, SelectionDialogs } from './SelectionDialogs'

// The bar rises from the bottom edge it sits on.
const enter = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
	to: { opacity: 1, transform: 'none' },
})

const styles = stylex.create({
	// A fixed spot near the bottom of the page. The collection page's body is
	// the nearest positioned ancestor, so the bar stays put while the scroll
	// area moves under it, and sits high enough to clear the scroll area's
	// bottom fade. Clicks pass through everywhere but the bar.
	dock: {
		insetInline: 0,
		display: 'flex',
		insetBlockEnd: spacing['4xl'],
		justifyContent: 'center',
		pointerEvents: 'none',
		position: 'absolute',
		zIndex: 2,
	},
	// Contrast-reversed, like the library's reveal pill.
	bar: {
		padding: spacing.xs,
		borderRadius: radii.full,
		gap: spacing['2xs'],
		paddingInlineStart: spacing.md,
		pointerEvents: 'auto',

		alignItems: 'center',
		display: 'flex',

		backgroundColor: colorsSemantic.surfaceInteractiveInverse,
		boxShadow: `0 4px 12px ${colorsSemantic.shadowPrimary}`,

		animationDuration: '200ms',
		animationName: {
			default: enter,
			'@media (prefers-reduced-motion: reduce)': 'none',
		},
		animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
	},
	count: {
		paddingInlineEnd: spacing.sm,

		color: colorsSemantic.textOnInverseSecondary,
		fontSize: fontSizes.sm,
		fontVariantNumeric: 'tabular-nums',
		fontWeight: fontWeights.medium,
		whiteSpace: 'nowrap',
	},
	// Ghost buttons recolored for the inverse surface.
	action: {
		backgroundColor: {
			default: colorsSemantic.surfaceTransparent,
			':hover': colorsSemantic.surfaceInteractiveInverseHover,
			':active': colorsSemantic.surfaceInteractiveInverseActive,
		},
		color: {
			default: colorsSemantic.textOnInverse,
			':hover': colorsSemantic.textOnInverse,
			':active': colorsSemantic.textOnInverse,
		},
	},
})

type SelectionActionBarProps = {
	/** The collection the page shows. */
	collectionId: Id<'collections'>
	/** What is selected, at least one item. */
	contents: SelectionContents
}

/** The actions for the selection, floating at the bottom of the page. */
export function SelectionActionBar({
	collectionId,
	contents,
}: SelectionActionBarProps) {
	const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
	const [isMoreOpen, setIsMoreOpen] = useState(false)
	const [dialog, setDialog] = useState<SelectionDialog>(null)
	const { toggleFlag, toggleRetire, toggleType } = useCardActions()
	const convertSections = useConvertSectionsToCollections()

	const { sections, coveredCards: cards } = contents
	const areAllFlagged = cards.every(card => card.flaggedAt !== undefined)
	const areAllRetired = cards.every(card => card.retiredAt !== undefined)
	const areAllFlashcards = cards.every(card => card.type === 'flashcard')
	const flashcards = cards.length > 1 ? 'flashcards' : 'flashcard'
	const subcollections =
		sections.length > 1 ? 'subcollections' : 'subcollection'

	return (
		<div {...stylex.props(styles.dock)}>
			<SelectionActionHotkeys
				menuElement={menuElement}
				hasCards={cards.length > 0}
				onToggleFlag={() => toggleFlag(cards)}
				onToggleRetire={() => toggleRetire(cards)}
				onToggleType={() => toggleType(cards)}
				onMove={() => setDialog('move')}
				onDelete={() => setDialog('delete')}
			/>
			<div
				role='toolbar'
				aria-label='Selection actions'
				{...stylex.props(styles.bar)}
			>
				<span aria-live='polite' {...stylex.props(styles.count)}>
					{countItems(contents)}
				</span>
				{cards.length > 0 ? (
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant='ghost'
									size='small'
									shape='round'
									xstyle={styles.action}
									onClick={() => toggleFlag(cards)}
									aria-keyshortcuts={ariaKeyShortcuts(
										appHotkeys.toggleSelectionFlag,
									)}
								>
									<Flag
										aria-hidden='true'
										size={iconSizes.sm}
										{...stylex.props(
											areAllFlagged &&
												cardStatusStyles.flagOn,
										)}
									/>
									{areAllFlagged ? 'Unflag' : 'Flag'}
									<ShortcutKeys
										hotkey={appHotkeys.toggleSelectionFlag}
										aria-hidden
									/>
								</Button>
							}
						/>
						<TooltipContent>
							{areAllFlagged ? 'Unflag' : 'Flag'}
							<ShortcutKeys
								hotkey={appHotkeys.toggleSelectionFlag}
							/>
						</TooltipContent>
					</Tooltip>
				) : null}
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant='ghost'
								size='small'
								shape='round'
								xstyle={styles.action}
								onClick={() => setDialog('move')}
								aria-keyshortcuts={ariaKeyShortcuts(
									appHotkeys.moveSelection,
								)}
							>
								Move
								<ShortcutKeys
									hotkey={appHotkeys.moveSelection}
									aria-hidden
								/>
							</Button>
						}
					/>
					<TooltipContent>
						Move
						<ShortcutKeys hotkey={appHotkeys.moveSelection} />
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant='ghost'
								size='small'
								shape='round'
								xstyle={styles.action}
								onClick={() => setDialog('delete')}
								aria-keyshortcuts={ariaKeyShortcuts(
									appHotkeys.deleteSelection,
								)}
							>
								Delete
								<ShortcutKeys
									hotkey={appHotkeys.deleteSelection}
									aria-hidden
								/>
							</Button>
						}
					/>
					<TooltipContent>
						Delete
						<ShortcutKeys hotkey={appHotkeys.deleteSelection} />
					</TooltipContent>
				</Tooltip>
				<DropdownMenu
					open={isMoreOpen}
					onOpenChange={open => {
						// A selection dialog temporarily takes focus from More.
						// Keep the menu available when the dialog is dismissed.
						if (dialog === null) setIsMoreOpen(open)
					}}
				>
					<DropdownMenuTrigger
						render={
							<Button
								aria-label='More actions'
								iconOnly
								variant='ghost'
								size='small'
								shape='round'
								xstyle={styles.action}
							/>
						}
					>
						<Ellipsis aria-hidden='true' size={iconSizes.sm} />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						ref={setMenuElement}
						align='end'
						side='top'
					>
						{cards.length > 0 ? (
							<>
								<DropdownMenuItem
									closeOnClick={false}
									icon={
										<Archive
											aria-hidden='true'
											size={iconSizes.sm}
											{...stylex.props(
												areAllRetired &&
													cardStatusStyles.retiredOn,
											)}
										/>
									}
									onClick={() => toggleRetire(cards)}
									{...hotkeyItemProps(
										appHotkeys.toggleSelectionRetire,
									)}
								>
									{areAllRetired ? 'Unretire' : 'Retire'}
								</DropdownMenuItem>
								<DropdownMenuItem
									closeOnClick={false}
									icon={
										<Zap
											aria-hidden='true'
											size={iconSizes.sm}
											{...stylex.props(
												areAllFlashcards &&
													cardStatusStyles.flashcardOn,
											)}
										/>
									}
									onClick={() => toggleType(cards)}
									{...hotkeyItemProps(
										appHotkeys.toggleSelectionType,
									)}
								>
									{areAllFlashcards
										? `Remove as ${flashcards}`
										: `Mark as ${flashcards}`}
								</DropdownMenuItem>
							</>
						) : null}
						{sections.length > 0 ? (
							<DropdownMenuItem
								closeOnClick={false}
								disabled={convertSections.isPending}
								icon={
									<FolderTree
										aria-hidden='true'
										size={iconSizes.sm}
									/>
								}
								onClick={() =>
									convertSections.mutate({ sections })
								}
							>
								{`Convert to ${subcollections}`}
							</DropdownMenuItem>
						) : null}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<SelectionDialogs
				collectionId={collectionId}
				contents={contents}
				dialog={dialog}
				onDialogChange={setDialog}
			/>
		</div>
	)
}
