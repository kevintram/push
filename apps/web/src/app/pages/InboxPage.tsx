import { useNavigate } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import {
	EntityCard,
	type EntityItem,
	type EntityType,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { EntityTypeFilter } from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { usePractices } from '~/features/practices/api/getPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

const MIN_CARD_WIDTH = 280

export function InboxPage() {
	const navigate = useNavigate()
	const [activeFilters, setActiveFilters] = useState<Array<EntityType>>([])
	const { data: inboxTopics, isLoading: isLoadingTopics } = useTopics({
		inboxed: true,
		archived: false
	})
	const { data: inboxSources, isLoading: isLoadingSources } = useSources({
		inboxed: true,
		archived: false
	})
	const { data: inboxPractices, isLoading: isLoadingPractices } = usePractices({
		inboxed: true,
		archived: false
	})
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	const isLoading = isLoadingTopics || isLoadingSources || isLoadingPractices

	// Combine and filter entities based on active filters
	const inboxItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = []
		const showAll = activeFilters.length === 0

		if (showAll || activeFilters.includes('topic')) {
			items.push(
				...(inboxTopics ?? []).map(
					(item): EntityItem => ({ type: 'topic', item })
				)
			)
		}
		if (showAll || activeFilters.includes('source')) {
			items.push(
				...(inboxSources ?? []).map(
					(item): EntityItem => ({ type: 'source', item })
				)
			)
		}
		if (showAll || activeFilters.includes('practice')) {
			items.push(
				...(inboxPractices ?? []).map(
					(item): EntityItem => ({ type: 'practice', item })
				)
			)
		}

		return items.sort(
			(a, b) =>
				new Date(b.item.updated_at).getTime() -
				new Date(a.item.updated_at).getTime()
		)
	}, [inboxTopics, inboxSources, inboxPractices, activeFilters])

	const handleEntitySelect = useCallback(
		(entity: EntityItem) => {
			switch (entity.type) {
				case 'topic':
					navigate({
						to: '/topics/$topicId',
						params: { topicId: entity.item.id.toString() }
					})
					break
				case 'source':
					navigate({
						to: '/sources/$sourceId',
						params: { sourceId: entity.item.id.toString() }
					})
					break
				case 'practice':
					navigate({
						to: '/practices/$practiceId',
						params: { practiceId: entity.item.id.toString() }
					})
					break
			}
		},
		[navigate]
	)

	const handleCreateInboxTopic = useCallback(async () => {
		const newTopic = await createTopic({
			inboxed: true,
			archived: false
		})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: newTopic.id.toString() }
		})
	}, [createTopic, navigate])

	const toggleFilter = useCallback((filter: EntityType) => {
		setActiveFilters(prev => {
			if (prev.includes(filter)) {
				return prev.filter(f => f !== filter)
			}
			return [...prev, filter]
		})
	}, [])

	const handleAllClick = useCallback(() => {
		setActiveFilters([])
	}, [])

	const inboxCountLabel = isLoading ? '...' : inboxItems.length

	return (
		<PageLayout>
			<PageLayout.Header icon={Inbox} title='Inbox'>
				<span className='font-semibold text-muted-foreground text-xl'>
					({inboxCountLabel})
				</span>
				<EntityTypeFilter
					activeFilters={activeFilters}
					onAllClick={handleAllClick}
					onToggle={toggleFilter}
				/>
			</PageLayout.Header>

			<InboxList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				items={inboxItems}
				onCreateInboxTopic={handleCreateInboxTopic}
				onEntitySelect={handleEntitySelect}
			/>
		</PageLayout>
	)
}

function InboxList({
	items,
	onEntitySelect,
	onCreateInboxTopic,
	isLoading,
	isCreatingTopic
}: {
	items: Array<EntityItem>
	onEntitySelect: (entity: EntityItem) => void
	onCreateInboxTopic: () => void
	isLoading: boolean
	isCreatingTopic: boolean
}) {
	const renderItem = useCallback(
		(entity: EntityItem) => {
			let headerRight: React.ReactNode
			switch (entity.type) {
				case 'topic':
					headerRight = <TopicActionMenu topic={entity.item} />
					break
				case 'source':
					headerRight = <SourceActionMenu source={entity.item} />
					break
				case 'practice':
					headerRight = <PracticeActionMenu practice={entity.item} />
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					onEntityClick={onEntitySelect}
				/>
			)
		},
		[onEntitySelect]
	)

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (items.length === 0) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Inbox />
						</EmptyMedia>
						<EmptyTitle>Your inbox is empty</EmptyTitle>
						<EmptyDescription>
							The inbox is for items to be processed later: fleeting notes,
							random ideas, whatever
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<EmptyStateCreateTopicButton
							buttonText='Add to your inbox'
							disabled={isCreatingTopic}
							onClick={onCreateInboxTopic}
						/>
					</EmptyContent>
				</Empty>
			</PageLayout.Content>
		)
	}

	return (
		<PageLayout.Content className='max-w-screen p-6'>
			<MasonryLayout
				estimateItemSize={estimateEntitySize}
				gap={16}
				getItemKey={getEntityKey}
				items={items}
				minItemWidth={MIN_CARD_WIDTH}
				overscan={6}
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
