import { useNavigate } from '@tanstack/react-router'
import { Inbox } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSectionCollapse } from '~/app/hooks/useSectionCollapse'
import { PageLayout } from '~/app/layouts/PageLayout'
import { EmptyStateCreateTopicButton } from '~/components/EmptyStateCreateTopicButton'
import type { EntityItem } from '~/components/EntityCard'
import { EntityCardSection } from '~/components/EntityCardSection'
import {
	EntityTypeFilter,
	type EntityTypeFilterValue
} from '~/components/EntityTypeFilter'
import { MasonryLayoutSkeleton } from '~/components/masonry-layout/MasonryLayoutSkeleton'
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from '~/components/ui/Empty'
import { useSearchAll } from '~/features/search/api/searchAll'
import { useCreateTopic } from '~/features/topics/api/createTopic'
import { useEntityNavigation } from '~/hooks/useEntityNavigation'
import {
	type DateSection,
	groupByDate,
	toEntityEntries
} from '~/utils/groupByDate'

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

	const dateSections = useMemo<Array<DateSection>>(
		() => groupByDate(toEntityEntries(searchResults)),
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
				onCreateInboxTopic={handleCreateInboxTopic}
				onEntitySelect={handleEntitySelect}
				sections={dateSections}
			/>
		</PageLayout>
	)
}

function InboxList({
	sections,
	onEntitySelect,
	onCreateInboxTopic,
	isLoading,
	isCreatingTopic
}: {
	sections: Array<DateSection>
	onEntitySelect: (entity: EntityItem) => void
	onCreateInboxTopic: () => void
	isLoading: boolean
	isCreatingTopic: boolean
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
			<div className='flex flex-col gap-2'>
				{sections.map(section => (
					<EntityCardSection
						id={section.id}
						isCollapsed={collapsedSections[section.id] ?? false}
						items={section.items}
						key={section.id}
						label={section.label}
						onEntityClick={onEntitySelect}
						onToggleCollapse={toggleSection}
					/>
				))}
			</div>
		</PageLayout.Content>
	)
}
