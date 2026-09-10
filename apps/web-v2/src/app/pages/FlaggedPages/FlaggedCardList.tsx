import * as stylex from '@stylexjs/stylex'
import { formatForDisplay, useHotkey } from '@tanstack/react-hotkeys'
import { Maximize2 } from 'lucide-react'
import { useState } from 'react'

import {
	Button,
	createDialogHandle,
	DialogTrigger,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'
import { CardItem } from '~/modules/reviews/components/CardItem'
import type { Card as CardModel } from '~/modules/reviews/types/review.types'
import { deriveCardSrsState } from '~/modules/reviews/utils/cardSrs'
import { semanticColors } from '~/styles/colors/semantic.stylex'
import {
	fontSizes,
	fontWeights,
	iconSizes,
	spacing,
} from '~/styles/tokens.stylex'
import type { DateString } from '~/types/date'

import { FlaggedCardFocusDialog } from './FlaggedCardFocusDialog'
import { FLAGGED_CARD_FOCUS_HOTKEY } from './flaggedCardFocusHotkey'

type FlaggedCardListProps = {
	cards: Array<CardModel>
	today: DateString
}

const styles = stylex.create({
	content: {
		marginBlock: spacing.xl,
	},
	heading: {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'space-between',
		marginBlockEnd: spacing.sm,
	},
	title: {
		fontSize: fontSizes.lg,
		fontWeight: fontWeights.semibold,
		marginBlockEnd: spacing.md,
	},
	empty: {
		color: semanticColors.textSecondary,
		fontSize: fontSizes.sm,
	},
})

export function FlaggedCardList({ cards, today }: FlaggedCardListProps) {
	const [focusDialogHandle] = useState(createDialogHandle)
	const cardCount = cards.length

	useHotkey(
		FLAGGED_CARD_FOCUS_HOTKEY,
		() => {
			if (focusDialogHandle.isOpen) focusDialogHandle.close()
			else focusDialogHandle.open(null)
		},
		{
			enabled: cardCount > 0,
			preventDefault: true,
			requireReset: true,
		},
	)

	return (
		<>
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.heading)}>
					<h1 {...stylex.props(styles.title)}>Flagged</h1>
					<Tooltip>
						<TooltipTrigger
							render={
								<DialogTrigger
									handle={focusDialogHandle}
									disabled={cardCount === 0}
									render={
										<Button
											variant='secondary'
											shape='round'
										/>
									}
								>
									<Maximize2 size={iconSizes.md} />
									Focus
								</DialogTrigger>
							}
						/>
						<TooltipContent>
							Focus
							<Kbd>
								{formatForDisplay(FLAGGED_CARD_FOCUS_HOTKEY)}
							</Kbd>
						</TooltipContent>
					</Tooltip>
				</div>
				{cardCount === 0 ? (
					<p {...stylex.props(styles.empty)}>No flagged cards.</p>
				) : null}
				{cards.map(card => (
					<CardItem
						key={card._id}
						card={card}
						srs={deriveCardSrsState(card, today)}
						today={today}
					/>
				))}
			</div>
			<FlaggedCardFocusDialog handle={focusDialogHandle} cards={cards} />
		</>
	)
}
