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
} from '~/modules/collections/api/sectionQueries'
import { cardQueries, useCreateCard } from '~/modules/reviews/api/cardQueries'
import { spacing } from '~/styles/tokens.stylex'

import { CardGroup } from './CardGroup'
import { groupCardsBySection } from './groupCardsBySection'
import { SectionActions } from './SectionActions'
import { SectionTitle } from './SectionTitle'

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

	// The section created from an "Add" menu, whose title takes focus so it
	// can be named right away.
	const [newSectionId, setNewSectionId] = useState<Id<'sections'> | null>(
		null,
	)
	const createSection = useCreateSection()
	const createCard = useCreateCard()
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

	const handleCreateSection = useCallback(() => {
		createSection.mutate(
			{ collectionId },
			{ onSuccess: sectionId => setNewSectionId(sectionId) },
		)
	}, [createSection, collectionId])

	const isAdding = createCard.isPending || createSection.isPending

	return (
		<div {...stylex.props(styles.groups)}>
			<CardGroup
				cards={grouped.unsectioned}
				today={today}
				title='Cards'
				addLabel='Add to cards'
				isAdding={isAdding}
				onAddCard={() => handleCreateCard()}
				onAddSection={handleCreateSection}
			/>
			{grouped.sections.map(({ section, cards: sectionCards }) => (
				<CardGroup
					key={section._id}
					cards={sectionCards}
					today={today}
					title={
						<SectionTitle
							section={section}
							autoFocus={section._id === newSectionId}
						/>
					}
					headingLevel={3}
					actions={<SectionActions section={section} />}
					addLabel={`Add to ${section.title || 'untitled section'}`}
					isAdding={isAdding}
					onAddCard={() => handleCreateCard(section._id)}
					onAddSection={handleCreateSection}
				/>
			))}
		</div>
	)
}
