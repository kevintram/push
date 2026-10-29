import * as stylex from '@stylexjs/stylex'
import { Archive, Ellipsis, Flag, FolderInput, Trash2, Zap } from 'lucide-react'
import { useState } from 'react'

import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui'
import {
	CardActionDialogs,
	type CardDialog,
} from '~/modules/reviews/components/CardActionDialogs'
import { useCardActions } from '~/modules/reviews/hooks/useCardActions'
import type { Card } from '~/modules/reviews/types/review.types'
import { colorsSemantic } from '~/styles/colors/colorsSemantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	radii,
	spacing,
} from '~/styles/tokens.stylex'

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
	/** The selected cards, at least one, in page order. */
	cards: ReadonlyArray<Card>
}

/** The actions for the selected cards, floating at the bottom of the page. */
export function SelectionActionBar({ cards }: SelectionActionBarProps) {
	const [dialog, setDialog] = useState<CardDialog>(null)
	const { toggleFlag, toggleRetire, toggleType } = useCardActions()

	const areAllFlagged = cards.every(card => card.flaggedAt !== undefined)
	const areAllRetired = cards.every(card => card.retiredAt !== undefined)
	const areAllFlashcards = cards.every(card => card.type === 'flashcard')
	const flashcards = cards.length > 1 ? 'flashcards' : 'flashcard'

	return (
		<div {...stylex.props(styles.dock)}>
			<div
				role='toolbar'
				aria-label='Selected cards'
				{...stylex.props(styles.bar)}
			>
				<span aria-live='polite' {...stylex.props(styles.count)}>
					{cards.length} selected
				</span>
				<Button
					variant='ghost'
					size='small'
					shape='round'
					xstyle={styles.action}
					onClick={() => toggleFlag(cards)}
				>
					<Flag aria-hidden='true' size={iconSizes.sm} />
					{areAllFlagged ? 'Unflag' : 'Flag'}
				</Button>
				<Button
					variant='ghost'
					size='small'
					shape='round'
					xstyle={styles.action}
					onClick={() => setDialog('move')}
				>
					<FolderInput aria-hidden='true' size={iconSizes.sm} />
					Move
				</Button>
				<Button
					variant='ghost'
					size='small'
					shape='round'
					xstyle={styles.action}
					onClick={() => setDialog('delete')}
				>
					<Trash2 aria-hidden='true' size={iconSizes.sm} />
					Delete
				</Button>
				<DropdownMenu>
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
					<DropdownMenuContent align='end' side='top'>
						<DropdownMenuItem
							icon={
								<Archive
									aria-hidden='true'
									size={iconSizes.sm}
								/>
							}
							onClick={() => toggleRetire(cards)}
						>
							{areAllRetired ? 'Unretire' : 'Retire'}
						</DropdownMenuItem>
						<DropdownMenuItem
							icon={
								<Zap aria-hidden='true' size={iconSizes.sm} />
							}
							onClick={() => toggleType(cards)}
						>
							{areAllFlashcards
								? `Remove as ${flashcards}`
								: `Mark as ${flashcards}`}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<CardActionDialogs
				cards={cards}
				dialog={dialog}
				onDialogChange={setDialog}
			/>
		</div>
	)
}
