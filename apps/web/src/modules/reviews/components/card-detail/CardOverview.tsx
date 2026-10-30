import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { Separator, Textarea } from '~/components/ui'
import { useToday } from '~/hooks/useToday'
import { scrollFade } from '~/styles/scrollFade'
import { fontSizes, fontWeights, layout, spacing } from '~/styles/tokens.stylex'

import { cardQueries } from '../../api/cardQueries'
import { useHideMode } from '../../hide-mode/useHideMode'
import { useCardField } from '../../hooks/useCardField'
import { deriveCardSrsState } from '../../utils/cardSrs'
import { CardMetadata } from '../CardMetadata'
import { Hideable } from '../Hideable'

const styles = stylex.create({
	layout: {
		gap: spacing.lg,
		overflow: 'hidden',
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		minHeight: 0,
		minWidth: 0,
		width: '100%',
	},
	main: {
		display: 'flex',
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1,
		justifyContent: 'center',
		minHeight: 0,
		minWidth: 0,
		overflowY: 'auto',
	},
	content: {
		gap: spacing.xl,
		display: 'flex',
		flexDirection: 'column',
		flexShrink: 1,
		marginBlockStart: spacing.xl,
		maxWidth: layout.contentColumnMaxWidth,
		minWidth: 0,
		width: '100%',
	},
	primary: {
		fontSize: fontSizes.xl,
		fontWeight: fontWeights.bold,
	},
	secondary: { fontSize: fontSizes.md },
	separatorGroup: {
		gap: spacing.sm,
		display: 'flex',
		flexDirection: 'column',
	},
	footer: { gap: spacing.md, alignItems: 'center', display: 'flex' },
	notesContainer: { flexBasis: 0, flexGrow: 1, flexShrink: 1 },
	notes: { blockSize: '100%', fontSize: fontSizes.md, inlineSize: '100%' },
})

type CardOverviewProps = {
	cardId: Id<'cards'>
}

export function CardOverview({ cardId }: CardOverviewProps) {
	// TODO(2): Review surfaces already have the full live card, but this ID-only
	// API opens another detail subscription for every card visited. Accept supplied
	// card data and shorten card-detail query GC so large queues do not retain
	// redundant Convex subscriptions.
	const { data: card } = useSuspenseQuery(cardQueries.detail(cardId))
	const { hideMode } = useHideMode()
	const [secondaryRevealed, setSecondaryRevealed] = useState(false)
	const [notesRevealed, setNotesRevealed] = useState(false)
	const today = useToday()

	useEffect(() => {
		setSecondaryRevealed(false)
		setNotesRevealed(false)
	}, [hideMode, cardId])

	const primaryText = useCardField({
		field: 'primaryText',
		cardId,
		value: card.primaryText,
	})
	const secondaryText = useCardField({
		field: 'secondaryText',
		cardId,
		value: card.secondaryText,
	})
	const notes = useCardField({
		field: 'notes',
		cardId,
		value: card.notes,
	})
	const srsState = deriveCardSrsState(card, today)

	const primaryTextPlaceholder = card.type === 'practice' ? 'Title' : 'Prompt'
	const secondaryTextPlaceholder =
		card.type === 'practice' ? 'Add description...' : 'Answer'

	return (
		<div {...stylex.props(styles.layout)}>
			<div {...stylex.props(styles.main, scrollFade.y)}>
				<div {...stylex.props(styles.content)}>
					<Textarea
						aria-label='Card primary text'
						placeholder={primaryTextPlaceholder}
						onBlur={primaryText.flush}
						onChange={primaryText.onChange}
						value={primaryText.value}
						xstyle={styles.primary}
					/>
					<Hideable
						revealed={
							card.type === 'practice' ||
							hideMode === 'off' ||
							secondaryRevealed
						}
						onRevealedChange={setSecondaryRevealed}
					>
						<Textarea
							aria-label='Card secondary text'
							placeholder={secondaryTextPlaceholder}
							onBlur={secondaryText.flush}
							onChange={secondaryText.onChange}
							value={secondaryText.value}
							xstyle={styles.secondary}
						/>
					</Hideable>
					<div {...stylex.props(styles.separatorGroup)}>
						<div {...stylex.props(styles.footer)}>
							<CardMetadata {...srsState} today={today} />
						</div>
						<Separator />
					</div>
					<Hideable
						revealed={hideMode === 'off' || notesRevealed}
						onRevealedChange={setNotesRevealed}
						xstyle={styles.notesContainer}
					>
						<Textarea
							aria-label='Card notes'
							placeholder='Add notes...'
							onBlur={notes.flush}
							onChange={notes.onChange}
							value={notes.value}
							xstyle={styles.notes}
						/>
					</Hideable>
				</div>
			</div>
		</div>
	)
}
