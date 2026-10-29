import type { Id } from '@convex/_generated/dataModel'
import * as stylex from '@stylexjs/stylex'
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useToday } from '~/hooks/useToday'
import {
	sectionQueries,
	useCreateSection,
	useMoveSections,
} from '~/modules/collections/api/sectionQueries'
import {
	cardQueries,
	useCreateCard,
	useMoveCards,
} from '~/modules/reviews/api/cardQueries'
import { buttonSizes, spacing } from '~/styles/tokens.stylex'

import { CardGroup } from './CardGroup'
import { CollectionHotkeys } from './CollectionHotkeys'
import {
	type MoveDirection,
	planCardMove,
	planSectionMove,
} from './collectionOrder'
import type { SelectMode } from './collectionSelection'
import { groupCardsBySection } from './groupCardsBySection'
import { SectionActions } from './SectionActions'
import { SectionTitle } from './SectionTitle'
import { SelectionActionBar } from './SelectionActionBar'
import { useCollectionSelection } from './useCollectionSelection'

const styles = stylex.create({
	groups: {
		gap: spacing['3xl'],
		display: 'flex',
		flexDirection: 'column',
	},
	// Room to scroll the last row clear of the action bar floating over the
	// bottom of the page.
	clearsActionBar: {
		paddingBlockEnd: `calc(${buttonSizes.small} + ${spacing['4xl']})`,
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
	const selectedSectionId =
		selected?.items.length === 1 && selected.cursor.kind === 'section'
			? selected.cursor.id
			: null
	const selectedCardIds = useMemo(
		() =>
			new Set(
				selected?.items.flatMap(item =>
					item.kind === 'card' ? [item.id] : [],
				),
			),
		[selected],
	)
	// In page order, so batch actions and moves keep the cards' order.
	const selectedCards = useMemo(
		() =>
			[
				...grouped.unsectioned,
				...grouped.sections.flatMap(({ cards }) => cards),
			].filter(card => selectedCardIds.has(card._id)),
		[grouped, selectedCardIds],
	)

	// The section whose title is a field. A new section starts out renaming so
	// it can be named right away.
	const [renamingSectionId, setRenamingSectionId] =
		useState<Id<'sections'> | null>(null)
	const createSection = useCreateSection()
	const createCard = useCreateCard()
	const moveSections = useMoveSections()
	const moveCard = useMoveCards()
	const navigate = useNavigate()
	const today = useToday()

	const handleCreateCard = useCallback(
		(sectionId?: Id<'sections'>) => {
			createCard.mutate(
				{ collectionId, sectionId },
				{
					onError: () => toast.error('Failed to create card'),
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

	// A new section goes right below the group whose menu added it. The
	// unsectioned cards come first, so their menu adds the first section.
	const handleCreateSection = useCallback(
		(afterId: Id<'sections'> | null) => {
			createSection.mutate(
				{ collectionId, afterId },
				{
					onSuccess: sectionId => {
						select({ kind: 'section', id: sectionId })
						setRenamingSectionId(sectionId)
					},
				},
			)
		},
		[createSection, collectionId, select],
	)

	const handleMove = useCallback(
		(direction: MoveDirection) => {
			if (selectedSectionId) {
				const plan = planSectionMove(
					grouped,
					new Set([selectedSectionId]),
					direction,
				)
				if (plan) moveSections.mutate(plan)
			} else if (selectedCards.length > 0) {
				const plan = planCardMove(grouped, selectedCardIds, direction)
				if (plan) moveCard.mutate(plan)
			}
		},
		[
			grouped,
			selectedSectionId,
			selectedCards,
			selectedCardIds,
			moveCard,
			moveSections,
		],
	)

	// Only a single card or section opens; several have nowhere to go.
	const handleOpen = useCallback(() => {
		const [card, ...rest] = selectedCards
		if (card && rest.length === 0) {
			void navigate({
				to: '/cards/$cardId',
				params: { cardId: card._id },
			})
		} else if (selectedSectionId) {
			setRenamingSectionId(selectedSectionId)
		}
	}, [navigate, selectedCards, selectedSectionId])

	const selectCard = useCallback(
		(cardId: Id<'cards'>, mode: SelectMode) =>
			select({ kind: 'card', id: cardId }, mode),
		[select],
	)
	const isAdding = createCard.isPending || createSection.isPending

	return (
		<div
			{...stylex.props(
				styles.groups,
				selectedCards.length > 0 && styles.clearsActionBar,
			)}
		>
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
				onAddSection={() => handleCreateSection(null)}
				selectedCardIds={selectedCardIds}
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
							isSelected={section._id === selectedSectionId}
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
					onAddSection={() => handleCreateSection(section._id)}
					selectedCardIds={selectedCardIds}
					onSelectCard={selectCard}
				/>
			))}
			{selectedCards.length > 0 ? (
				<SelectionActionBar cards={selectedCards} />
			) : null}
		</div>
	)
}
