import { Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import type { EntityItem } from '~/components/EntityCard'
import { EntityCardSection } from '~/components/EntityCardSection'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/empty'
import { LoadingSpinner } from '~/components/ui/loading-spinner'
import { useSearchAll } from '~/features/search/api/searchAll'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'
import {
	type DateSection,
	groupByDate,
	toEntityEntries
} from '~/utils/groupByDate'

const RECENT_LIMIT = 50

export function RecentPage() {
	const handleEntityClick = useEntityNavigation()
	const [activeFilter, setActiveFilter] = useState<EntityTypeFilterValue>('all')

	const { data: searchResults = [], isLoading } = useSearchAll({
		limit: RECENT_LIMIT,
		entityTypes: activeFilter === 'all' ? undefined : activeFilter
	})

	const dateSections = useMemo<Array<DateSection>>(
		() => groupByDate(toEntityEntries(searchResults)),
		[searchResults]
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
		return (
			<PageLayout.Content className='max-w-screen p-6'>
				<LoadingSpinner containerClassName='min-h-64' />
			</PageLayout.Content>
		)
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
					<EntityCardSection
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
