import { useNavigate } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { PageLayout } from '~/app/layouts/PageLayout'
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
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { usePractices } from '~/features/practices/api/getPractices'
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSources } from '~/features/sources/api/getSources'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { useTopics } from '~/features/topics/api/getTopics'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

const RECENT_LIMIT = 50

export function RecentPage() {
	const navigate = useNavigate()
	const [activeFilters, setActiveFilters] = useState<Array<EntityType>>([])

	// Fetch 50 most recent topics, sources, and practices
	const { data: topics = [], isLoading: isLoadingTopics } = useTopics({
		order: 'desc',
		limit: RECENT_LIMIT
	})
	const { data: sources = [], isLoading: isLoadingSources } = useSources({
		order: 'desc',
		limit: RECENT_LIMIT
	})
	const { data: practices = [], isLoading: isLoadingPractices } = usePractices({
		order: 'desc',
		limit: RECENT_LIMIT
	})

	const isLoading = isLoadingTopics || isLoadingSources || isLoadingPractices

	// Combine and filter entities based on active filters, limited to 50
	const recentItems = useMemo<Array<EntityItem>>(() => {
		const items: Array<EntityItem> = []
		const showAll = activeFilters.length === 0

		if (showAll || activeFilters.includes('topic')) {
			items.push(
				...(topics ?? []).map((item): EntityItem => ({ type: 'topic', item }))
			)
		}
		if (showAll || activeFilters.includes('source')) {
			items.push(
				...(sources ?? []).map((item): EntityItem => ({ type: 'source', item }))
			)
		}
		if (showAll || activeFilters.includes('practice')) {
			items.push(
				...(practices ?? []).map(
					(item): EntityItem => ({ type: 'practice', item })
				)
			)
		}

		return items
			.sort(
				(a, b) =>
					new Date(b.item.updated_at).getTime() -
					new Date(a.item.updated_at).getTime()
			)
			.slice(0, RECENT_LIMIT)
	}, [topics, sources, practices, activeFilters])

	const handleEntityClick = useCallback(
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

	return (
		<PageLayout>
			<PageLayout.Header icon={Clock} title='Recent'>
				<EntityTypeFilter
					activeFilters={activeFilters}
					onAllClick={handleAllClick}
					onToggle={toggleFilter}
				/>
			</PageLayout.Header>
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
					minHeight={96}
					onEntityClick={onEntityClick}
				/>
			)
		},
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
							<Clock />
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
