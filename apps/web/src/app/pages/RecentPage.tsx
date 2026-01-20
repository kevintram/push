import { useNavigate } from '@tanstack/react-router'
import { History } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
import {
	EntityCard,
	type EntityItem,
	estimateEntitySize,
	getEntityKey
} from '~/components/EntityCard'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

const RECENT_LIMIT = 50

export function RecentPage() {
	const navigate = useNavigate()

	// Fetch 50 most recent topics and sources
	const { data: topics = [], isLoading: isLoadingTopics } = useTopics({
		order: 'desc',
		limit: RECENT_LIMIT
	})
	const { data: sources = [], isLoading: isLoadingSources } = useSources({
		order: 'desc',
		limit: RECENT_LIMIT
	})

	const isLoading = isLoadingTopics || isLoadingSources

	// Combine topics and sources, sorted by updated_at descending, limited to 50
	const recentItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = [
			...(topics ?? []).map((item): EntityItem => ({ type: 'topic', item })),
			...(sources ?? []).map((item): EntityItem => ({ type: 'source', item }))
		]
		return items
			.sort(
				(a, b) =>
					new Date(b.item.updated_at).getTime() -
					new Date(a.item.updated_at).getTime()
			)
			.slice(0, RECENT_LIMIT)
	}, [topics, sources])

	const handleEntityClick = useCallback(
		(entity: EntityItem) => {
			if (entity.type === 'topic') {
				navigate({
					to: '/topics/$topicId',
					params: { topicId: entity.item.id.toString() }
				})
			} else {
				navigate({
					to: '/sources/$sourceId',
					params: { sourceId: entity.item.id.toString() }
				})
			}
		},
		[navigate]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={History} title='Recent' />
			<RecentList
				isLoading={isLoading}
				items={recentItems}
				onEntityClick={handleEntityClick}
			/>
		</PageLayout>
	)
}

function RecentList({
	items,
	onEntityClick,
	isLoading
}: {
	items: Array<EntityItem>
	onEntityClick: (entity: EntityItem) => void
	isLoading: boolean
}) {
	const renderItem = useCallback(
		(entity: EntityItem) => (
			<EntityCard
				entity={entity}
				headerRight={
					entity.type === 'topic' ? (
						<TopicActionMenu topic={entity.item} />
					) : (
						<SourceActionMenu source={entity.item} />
					)
				}
				minHeight={96}
				onEntityClick={onEntityClick}
			/>
		),
		[onEntityClick]
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
							<History />
						</EmptyMedia>
						<EmptyTitle>No recent items</EmptyTitle>
						<EmptyDescription>
							See your most recently edited topics and sources
						</EmptyDescription>
					</EmptyHeader>
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
				minItemWidth={280}
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
