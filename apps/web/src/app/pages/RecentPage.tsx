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
import { PracticeActionMenu } from '~/features/practices/components/PracticeActionMenu'
import { useSearchAll } from '~/features/search/api/searchAll'
import { SourceActionMenu } from '~/features/sources/components/SourceActionMenu'
import { TopicActionMenu } from '~/features/topics/components/TopicActionMenu'

const RECENT_LIMIT = 50

export function RecentPage() {
	const navigate = useNavigate()
	const [activeFilters, setActiveFilters] = useState<Array<EntityType>>([])

	const entityTypes =
		activeFilters.length > 0 ? activeFilters.join(',') : undefined

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes
	})

	// Map SearchResultItem[] to EntityItem[]
	const recentItems = useMemo<Array<EntityItem>>(() => {
		return searchResults.map((result): EntityItem => {
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
	}, [searchResults])

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
		setActiveFilters([filter])
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
							See your most recently edited or reviewed items
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
