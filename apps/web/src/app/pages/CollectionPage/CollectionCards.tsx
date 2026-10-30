import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'

import { useToday } from '~/hooks/useToday'
import {
	sectionQueries,
	useCreateSection,
	useMoveSection,
} from '~/modules/collections/api/sectionQueries'
import {
	cardQueries,
	useCreateCard,
	useMoveCard,
} from '~/modules/reviews/api/cardQueries'
import { spacing } from '~/styles/tokens.stylex'

import { CardGroup } from './CardGroup'
import { CollectionHotkeys } from './CollectionHotkeys'
import {
	type MoveDirection,
	planCardMove,
	planSectionMove,
} from './collectionOrder'
import { groupCardsBySection } from './groupCardsBySection'
import { SectionActions } from './SectionActions'
import { SectionTitle } from './SectionTitle'
import { useCollectionSelection } from './useCollectionSelection'

const styles = stylex.create({
	groups: {
		gap: spacing['3xl'],
		display: 'flex',
		flexDirection: 'column',
	},
})

type CollectionCardsProps = {
	collectionId: Id<'collections'>
}

/** A collection's unsectioned cards, then each of its sections in turn. */
export function CollectionCards({ collectionId }: CollectionCardsProps) {
	const [{ data: sections }, { data: cards }] = useSuspenseQueries({
		queries: [
			queryOptions(sectionQueries.listByCollection(collectionId)),
			queryOptions(cardQueries.listByCollection(collectionId)),
		],
	})
	const grouped = useMemo(
		() => groupCardsBySection(sections, cards),
		[sections, cards],
	)
	const { selected, select, clear, selectAdjacent } =
		useCollectionSelection(grouped)

	// The section whose title is a field. A new section starts out renaming so
	// it can be named right away.
	const [renamingSectionId, setRenamingSectionId] =
		useState<Id<'sections'> | null>(null)
	const createSection = useCreateSection()
	const createCard = useCreateCard()
	const moveSection = useMoveSection()
	const moveCard = useMoveCard()
	const navigate = useNavigate()
	const today = useToday()

	const handleCreateCard = useCallback(
		(sectionId?: Id<'sections'>) => {
			createCard.mutate(
				{ collectionId, sectionId },
				{
					onSuccess: cardId =>
						void navigate({
							to: '/cards/$cardId',
							params: { cardId },
						}),
				},
			)
		},
		[createCard, navigate, collectionId],
	)

	const handleCreateSection = useCallback(() => {
		createSection.mutate(
			{ collectionId },
			{
				onSuccess: sectionId => {
					select({ kind: 'section', id: sectionId })
					setRenamingSectionId(sectionId)
				},
			},
		)
	}, [createSection, collectionId, select])

	const handleMove = useCallback(
		(direction: MoveDirection) => {
			if (selected?.kind === 'card') {
				const placement = planCardMove(grouped, selected.id, direction)
				if (placement) {
					moveCard.mutate({ cardId: selected.id, ...placement })
				}
			} else if (selected?.kind === 'section') {
				const placement = planSectionMove(
					grouped,
					selected.id,
					direction,
				)
				if (placement) {
					moveSection.mutate({ sectionId: selected.id, ...placement })
				}
			}
		},
		[grouped, selected, moveCard, moveSection],
	)

	const handleOpen = useCallback(() => {
		if (selected?.kind === 'card') {
			void navigate({
				to: '/cards/$cardId',
				params: { cardId: selected.id },
			})
		} else if (selected?.kind === 'section') {
			setRenamingSectionId(selected.id)
		}
	}, [navigate, selected])

	const selectCard = useCallback(
		(cardId: Id<'cards'>) => select({ kind: 'card', id: cardId }),
		[select],
	)
	const selectedCardId = selected?.kind === 'card' ? selected.id : null
	const isAdding = createCard.isPending || createSection.isPending

	return (
		<div {...stylex.props(styles.groups)}>
			<CollectionHotkeys
				hasSelection={selected !== null}
				onSelectAdjacent={selectAdjacent}
				onMove={handleMove}
				onOpen={handleOpen}
				onClear={clear}
			/>
			<CardGroup
				cards={grouped.unsectioned}
				today={today}
				title='Cards'
				addLabel='Add to cards'
				isAdding={isAdding}
				onAddCard={() => handleCreateCard()}
				onAddSection={handleCreateSection}
				selectedCardId={selectedCardId}
				onSelectCard={selectCard}
			/>
			{grouped.sections.map(({ section, cards: sectionCards }) => (
				<CardGroup
					key={section._id}
					cards={sectionCards}
					today={today}
					title={
						<SectionTitle
							section={section}
							isSelected={
								selected?.kind === 'section' &&
								selected.id === section._id
							}
							isRenaming={section._id === renamingSectionId}
							onSelect={() =>
								select({ kind: 'section', id: section._id })
							}
							onRename={() => setRenamingSectionId(section._id)}
							onRenameEnd={() => setRenamingSectionId(null)}
						/>
					}
					headingLevel={3}
					actions={<SectionActions section={section} />}
					addLabel={`Add to ${section.title || 'untitled section'}`}
					isAdding={isAdding}
					onAddCard={() => handleCreateCard(section._id)}
					onAddSection={handleCreateSection}
					selectedCardId={selectedCardId}
					onSelectCard={selectCard}
				/>
			))}
		</div>
	)
}
