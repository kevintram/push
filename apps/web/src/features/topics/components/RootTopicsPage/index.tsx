import { Archive, Inbox, Plus, SquareLibrary } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'
import { useRootTopics } from '~/features/topics/api/useRootTopics'
import type { Topic } from '~/models/todo-topic.types'
import { TopicCard } from '../TopicCard'
import type { RenderedFilter } from './FilterBadges'
import { RootTopicsPageSkeleton } from './RootTopicsPageSkeleton'
import { TopicsPageHeader } from './TopicsPageHeader'
import { TopicsPageLayout } from './TopicsPageLayout'

const MIN_CARD_WIDTH = 280
const MIN_HEIGHT = 96

type FilterId = 'archived' | 'inboxed'

type FilterBadge = {
	id: FilterId
	label: string
	icon: React.ReactNode
	isActive: boolean
	onClick: () => void
}

export function RootTopicsPage() {
	const [activeFilter, setActiveFilter] = useState<FilterId | null>(null)
	const { openTopicDialog } = useTodoTopicDialog()

	// Build query params based on active filter (mutually exclusive)
	const queryParams = useMemo(() => {
		if (activeFilter === 'inboxed') {
			return { inboxed: true }
		}
		if (activeFilter === 'archived') {
			return { archived: true }
		}
		// Default: show non-archived and non-inboxed topics
		return { inboxed: false, archived: false }
	}, [activeFilter])

	// Fetch root topics from API with server-side filtering
	const { data: topics = [], isLoading } = useRootTopics(queryParams)

	const { mutateAsync: createTopicAsync } = useCreateTopic()

	// Filter handler - mutually exclusive (radio behavior)
	const handleFilterClick = useCallback((filterId: FilterId) => {
		setActiveFilter(prev => (prev === filterId ? null : filterId))
	}, [])

	const handleClearFilters = useCallback(() => {
		setActiveFilter(null)
	}, [])

	// Create filter badges
	const filters: Array<FilterBadge> = useMemo(
		() => [
			{
				id: 'inboxed' as const,
				label: 'Inbox',
				icon: <Inbox className='h-4 w-4' />,
				isActive: activeFilter === 'inboxed',
				onClick: () => handleFilterClick('inboxed')
			},
			{
				id: 'archived' as const,
				label: 'Archived',
				icon: <Archive className='h-4 w-4' />,
				isActive: activeFilter === 'archived',
				onClick: () => handleFilterClick('archived')
			}
		],
		[activeFilter, handleFilterClick]
	)

	const activeFilterBadge = filters.find(f => f.isActive)
	const inactiveFilterBadges = filters.filter(f => !f.isActive)
	const hasActiveFilter = activeFilterBadge !== undefined

	const renderedFilters: Array<RenderedFilter> = hasActiveFilter
		? [
				{
					key: activeFilterBadge.id,
					type: 'filter' as const,
					filter: activeFilterBadge
				},
				{ key: 'clear', type: 'clear' as const },
				...inactiveFilterBadges.map(filter => ({
					key: filter.id,
					type: 'filter' as const,
					filter
				}))
			]
		: filters.map(filter => ({
				key: filter.id,
				type: 'filter' as const,
				filter
			}))

	const handleCreateTopic = useCallback(async () => {
		const newTopic = await createTopicAsync({
			inboxed: false,
			archived: false
		})
		openTopicDialog(newTopic.id)
	}, [createTopicAsync, openTopicDialog])

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const estimateItemSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_HEIGHT)
	}, [])

	const renderItem = useCallback(
		(topic: Topic) => (
			<TopicCard
				minHeight={MIN_HEIGHT}
				onTopicClick={handleTopicClick}
				todos={topic.todos ?? []}
				topic={topic}
			/>
		),
		[handleTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const emptyMessage = hasActiveFilter
		? 'No topics match the selected filter'
		: 'No root topics yet'

	return (
		<TopicsPageLayout>
			<TopicsPageHeader
				onClearFilters={handleClearFilters}
				onCreateTopic={handleCreateTopic}
				renderedFilters={renderedFilters}
			/>

			{isLoading && <RootTopicsPageSkeleton />}

			{!isLoading && topics.length === 0 && (
				<div className='px-6 pt-2'>
					<div className='text-center'>
						<SquareLibrary className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
						<p className='mb-2 text-muted-foreground'>{emptyMessage}</p>
						<Button onClick={handleCreateTopic} variant='outline'>
							<Plus className='mr-2 h-4 w-4' />
							Create your first topic
						</Button>
					</div>
				</div>
			)}

			{!isLoading && topics.length > 0 && (
				<div className='p-6 pt-2'>
					<MasonryLayout
						estimateItemSize={estimateItemSize}
						gap={16}
						getItemKey={getItemKey}
						items={topics}
						minItemWidth={MIN_CARD_WIDTH}
						renderItem={renderItem}
					/>
				</div>
			)}
		</TopicsPageLayout>
	)
}
