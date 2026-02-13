import { useNavigate } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
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
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSearchAll } from '~/features/search/api/searchAll'
import type { SearchResultItem } from '~/features/search/types/search.types'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

function toEntityItems(results: Array<SearchResultItem>): Array<EntityItem> {
	return results.map(result => {
		switch (result.entity_type) {
			case 'topic':
				return { type: 'topic', item: result.topic }
			case 'source':
				return { type: 'source', item: result.source }
			case 'practice':
				return { type: 'practice', item: result.practice }
			default: {
				const _exhaustiveCheck: never = result
				return _exhaustiveCheck
			}
		}
	})
}

export function InboxPage() {
	const navigate = useNavigate()
	const handleEntitySelect = useEntityNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		inboxed: true,
		archived: false,
		entityTypes: activeFilter === 'all' ? undefined : activeFilter
	})

	const { mutateAsync: createTopic, isPending: isCreatingTopic } =
		useCreateTopic()

	const entityItems = useMemo(
		() => toEntityItems(searchResults),
		[searchResults]
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

	const inboxCountLabel = isLoading ? '...' : searchResults.length

	return (
		<PageLayout>
			<PageLayout.Header
				icon={Inbox}
				title='Inbox'
				titleExtra={
					<span className='font-semibold text-muted-foreground text-xl'>
						{inboxCountLabel}
					</span>
				}
			>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>

			<InboxList
				isCreatingTopic={isCreatingTopic}
				isLoading={isLoading}
				items={entityItems}
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
				default:
					break
			}
			return (
				<EntityCard
					entity={entity}
					headerRight={headerRight}
					minHeight={96}
					onEntityClick={onEntitySelect}
				/>
			)
		},
		[onEntitySelect]
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
				getItemKey={getEntityKey}
				items={items}
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
