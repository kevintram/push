import { useNavigate } from '@tanstack/react-router'
import { Library } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { usePractices } from '~/features/practices/api/getPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

export function MyLibraryPage() {
	const navigate = useNavigate()
	const handleEntityClick = useEntityNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')
	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	// Fetch root topics (non-archived, non-inboxed)
	const { data: topics = [], isLoading: isLoadingTopics } = useTopics({
		root: true,
		archived: false,
		inboxed: false
	})

	// Fetch root sources (non-archived, non-inboxed)
	const { data: sources = [], isLoading: isLoadingSources } = useSources({
		root: true,
		archived: false,
		inboxed: false
	})

	// Fetch practices (non-archived, non-inboxed)
	const { data: practices = [], isLoading: isLoadingPractices } = usePractices({
		archived: false,
		inboxed: false
	})

	const isLoading = isLoadingTopics || isLoadingSources || isLoadingPractices

	// Combine and filter entities based on active filter
	const libraryItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = []

		if (activeFilter === 'all' || activeFilter === 'topic') {
			items.push(
				...(topics ?? []).map((item): EntityItem => ({ type: 'topic', item }))
			)
		}
		if (activeFilter === 'all' || activeFilter === 'source') {
			items.push(
				...(sources ?? []).map((item): EntityItem => ({ type: 'source', item }))
			)
		}
		if (activeFilter === 'all' || activeFilter === 'practice') {
			items.push(
				...(practices ?? []).map(
					(item): EntityItem => ({ type: 'practice', item })
				)
			)
		}

		return items.sort(
			(a, b) =>
				new Date(b.item.updated_at).getTime() -
				new Date(a.item.updated_at).getTime()
		)
	}, [topics, sources, practices, activeFilter])

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopic({
			inboxed: false,
			archived: false
		})
		navigate({
			to: '/topics/$topicId',
			params: { topicId: newTopic.id.toString() }
		})
	}, [createTopic, navigate])

	return (
		<PageLayout>
			<PageLayout.Header icon={Library} title='My Library'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			<LibraryList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				items={libraryItems}
				onCreateTopic={handleCreateTopic}
				onEntityClick={handleEntityClick}
			/>
		</PageLayout>
	)
}

function LibraryList({
	items,
	onEntityClick,
	onCreateTopic,
	isLoading,
	isCreatingTopic
}: {
	items: Array<EntityItem>
	onEntityClick: (entity: EntityItem) => void
	onCreateTopic: () => void
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
				default:
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={onEntityClick}
				/>
			)
		},
		[onEntityClick]
	)

	if (isLoading) {
		return (
			<PageLayout.Content className='max-w-screen p-6'>
				<MasonryLayoutSkeleton />
			</PageLayout.Content>
		)
	}

	if (items.length === 0) {
		return (
			<PageLayout.Content>
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant='icon'>
							<Library />
						</EmptyMedia>
						<EmptyTitle>A place for all your learning</EmptyTitle>
						<EmptyDescription>
							Create a topic or source to get started
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<EmptyStateCreateTopicButton
							buttonText='Create new topic'
							disabled={isCreatingTopic}
							onClick={onCreateTopic}
							showHoverCard={false}
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
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
