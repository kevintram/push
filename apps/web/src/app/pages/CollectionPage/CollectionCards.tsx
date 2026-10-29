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
import { type SelectMode, selectModeFor } from './collectionSelection'
import { groupCardsBySection } from './groupCardsBySection'
import { SectionActions } from './SectionActions'
import { SectionTitle } from './SectionTitle'
import { SelectionActionBar } from './SelectionActionBar'
import { selectionContents } from './selectionContents'
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
	const selectedSectionIds = useMemo(
		() =>
			new Set(
				selected?.items.flatMap(item =>
					item.kind === 'section' ? [item.id] : [],
				),
			),
		[selected],
	)
	const selectedCardIds = useMemo(
		() =>
			new Set(
				selected?.items.flatMap(item =>
					item.kind === 'card' ? [item.id] : [],
				),
			),
		[selected],
	)
	// In page order, so batch actions keep the items' order.
	const contents = useMemo(
		() => selectionContents(grouped, selectedSectionIds, selectedCardIds),
		[grouped, selectedSectionIds, selectedCardIds],
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

	// Sections reorder among sections and cards among cards, so a selection
	// of both has nowhere to move.
	const handleMove = useCallback(
		(direction: MoveDirection) => {
			if (selectedCardIds.size === 0) {
				const plan = planSectionMove(
					grouped,
					selectedSectionIds,
					direction,
				)
				if (plan) moveSections.mutate(plan)
			} else if (selectedSectionIds.size === 0) {
				const plan = planCardMove(grouped, selectedCardIds, direction)
				if (plan) moveCard.mutate(plan)
			}
		},
		[grouped, selectedSectionIds, selectedCardIds, moveCard, moveSections],
	)

	// Only a single card or section opens; several have nowhere to go.
	const handleOpen = useCallback(() => {
		const [item, ...rest] = selected?.items ?? []
		if (!item || rest.length > 0) return

		if (item.kind === 'card') {
			void navigate({ to: '/cards/$cardId', params: { cardId: item.id } })
		} else {
			setRenamingSectionId(item.id)
		}
	}, [navigate, selected])

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
				selected !== null && styles.clearsActionBar,
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
							isSelected={selectedSectionIds.has(section._id)}
							isRenaming={section._id === renamingSectionId}
							onSelect={event =>
								select(
									{ kind: 'section', id: section._id },
									selectModeFor(event),
								)
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
			{selected !== null ? (
				<SelectionActionBar
					collectionId={collectionId}
					contents={contents}
				/>
			) : null}
		</div>
	)
}
