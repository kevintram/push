import { Archive } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
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
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { usePractices } from '~/features/practices/api/getPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'

export function ArchivedPage() {
	const handleEntityClick = useEntityNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	// Fetch archived topics, sources, and practices sorted by most recently updated
	const { data: topics = [], isLoading: isLoadingTopics } = useTopics({
		archived: true,
		order: 'desc'
	})
	const { data: sources = [], isLoading: isLoadingSources } = useSources({
		archived: true,
		order: 'desc'
	})
	const { data: practices = [], isLoading: isLoadingPractices } = usePractices({
		archived: true,
		order: 'desc'
	})

	const isLoading = isLoadingTopics || isLoadingSources || isLoadingPractices

	// Combine and filter entities based on active filter
	const archivedItems = useMemo<Array<EntityItem>>(() => {
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

	return (
		<PageLayout>
			<PageLayout.Header icon={Archive} title='Archived'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			<ArchivedList
				isLoading={isLoading}
				items={archivedItems}
				onEntityClick={handleEntityClick}
			/>
		</PageLayout>
	)
}

function ArchivedList({
	items,
	onEntityClick,
	isLoading
}: {
	items: Array<EntityItem>
	onEntityClick: (entity: EntityItem) => void
	isLoading: boolean
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
							<Archive />
						</EmptyMedia>
						<EmptyTitle>No archived items</EmptyTitle>
						<EmptyDescription>
							Archive items you want to hide but keep around just in case
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
				renderItem={renderItem}
			/>
		</PageLayout.Content>
	)
}
