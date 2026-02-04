import { useNavigate } from '@tanstack/react-router'
import { ChevronDown, Clock } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
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
import { Button } from '~/components/ui/Button'
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

type DateSection = {
	id: string
	label: string
	items: Array<EntityItem>
}

function getDateKey(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDateLabel(date: Date, today: Date): string {
	const todayKey = getDateKey(today)
	const dateKey = getDateKey(date)

	if (dateKey === todayKey) return 'Today'

	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	if (dateKey === getDateKey(yesterday)) return 'Yesterday'

	const daysDiff = Math.floor(
		(today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
	)
	return `${daysDiff}d ago`
}

function groupByDate(
	searchResults: Array<{
		entity: EntityItem
		recentActivityAt: string
	}>
): Array<DateSection> {
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const groupMap = new Map<
		string,
		{ label: string; items: Array<EntityItem> }
	>()
	const groupOrder: Array<string> = []

	for (const { entity, recentActivityAt } of searchResults) {
		const date = new Date(recentActivityAt)
		const key = getDateKey(date)

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				label: getDateLabel(date, today),
				items: []
			})
			groupOrder.push(key)
		}
		groupMap.get(key)!.items.push(entity)
	}

	return groupOrder.map(key => ({
		id: key,
		label: groupMap.get(key)!.label,
		items: groupMap.get(key)!.items
	}))
}

export function RecentPage() {
	const navigate = useNavigate()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes: activeFilter === 'all' ? undefined : activeFilter
	})

	const dateSections = useMemo<Array<DateSection>>(() => {
		const items = searchResults.map(result => {
			let entity: EntityItem
			switch (result.entity_type) {
				case 'topic':
					entity = { type: 'topic', item: result.topic }
					break
				case 'source':
					entity = { type: 'source', item: result.source }
					break
				case 'practice':
					entity = { type: 'practice', item: result.practice }
					break
				default: {
					const _exhaustiveCheck: never = result
					return _exhaustiveCheck
				}
			}
			return { entity, recentActivityAt: result.recent_activity_at }
		})
		return groupByDate(items)
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
				default:
					break
			}
		},
		[navigate]
	)

	return (
		<PageLayout>
			<PageLayout.Header icon={Clock} title='Recent'>
				<EntityTypeFilter
					activeFilter={activeFilter}
					onFilterChange={setActiveFilter}
				/>
			</PageLayout.Header>
			<RecentList
				isLoading={isLoading}
				onEntityClick={handleEntityClick}
				sections={dateSections}
			/>
		</PageLayout>
	)
}

function RecentList({
	sections,
	onEntityClick,
	isLoading
}: {
	sections: Array<DateSection>
	onEntityClick: (entity: EntityItem) => void
	isLoading: boolean
}) {
	const { collapsedSections, toggleSection } = useSectionCollapse()

	if (isLoading) {
		return <MasonryLayoutSkeleton />
	}

	if (sections.length === 0) {
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
			<div className='flex flex-col gap-2'>
				{sections.map(section => (
					<RecentSection
						id={section.id}
						isCollapsed={collapsedSections[section.id] ?? false}
						items={section.items}
						key={section.id}
						label={section.label}
						onEntityClick={onEntityClick}
						onToggleCollapse={toggleSection}
					/>
				))}
			</div>
		</PageLayout.Content>
	)
}

function RecentSection({
	id,
	label,
	items,
	isCollapsed,
	onToggleCollapse,
	onEntityClick
}: {
	id: string
	label: string
	items: Array<EntityItem>
	isCollapsed: boolean
	onToggleCollapse: (sectionId: string) => void
	onEntityClick: (entity: EntityItem) => void
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

	return (
		<div className='mb-2'>
			<div className='flex items-center justify-between'>
				<Button
					className='flex items-center gap-2 p-0'
					onClick={() => onToggleCollapse(id)}
					variant='ghost'
				>
					<h2 className='font-bold text-xl'>
						{label}{' '}
						<span className='text-muted-foreground'>({items.length})</span>
					</h2>
					<ChevronDown
						className={`h-5 w-5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
					/>
				</Button>
			</div>

			{!isCollapsed && (
				<div className='mt-2 mb-10 ml-5'>
					<MasonryLayout
						estimateItemSize={estimateEntitySize}
						getItemKey={getEntityKey}
						items={items}
						minItemWidth={280}
						renderItem={renderItem}
					/>
				</div>
			)}
		</div>
	)
}
