import { ChevronDown } from 'lucide-react'
import { useCallback } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { useTodoTopicDialog } from '~/features/dialogs/hooks/useTodoTopicDialog'
import { TopicCard } from '~/features/topics/components/TopicCard'
import { useSectionedTopics } from '~/features/topics/api/useSectionedTopics'
import type { Topic } from '~/models/todo-topic.types'
import { TopicsSidebarHeader } from './TopicsSidebarHeader'

const MIN_WIDTH = 280
const MIN_HEIGHT = 96

export function TopicsSidebar() {
	const {
		filteredSections,
		filters,
		toggleSectionCollapse,
		handleClearFilters,
		isLoading
	} = useSectionedTopics()
	const { openTopicDialog } = useTodoTopicDialog()

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
		(topic: Topic) => {
			return (
				<TopicCard
					minHeight={MIN_HEIGHT}
					onTopicClick={handleTopicClick}
					topic={topic}
				/>
			)
		},
		[handleTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => {
		return topic.id
	}, [])

	if (isLoading) {
		return (
			<div className='flex h-full flex-col overflow-auto bg-primary-foreground border-l'>
				<TopicsSidebarHeader
					filters={[]}
					onClearFilters={handleClearFilters}
				/>
				<div className='flex flex-col gap-6 px-2 pb-2'>
					<div className='text-muted-foreground text-sm'>Loading...</div>
				</div>
			</div>
		)
	}

	return (
		<div className='flex h-full flex-col overflow-auto bg-primary-foreground border-l'>
			<TopicsSidebarHeader
				filters={filters}
				onClearFilters={handleClearFilters}
			/>
			<div className='flex flex-col gap-6 px-2 pb-2'>
				{filteredSections.map(section => (
					<div className='flex flex-col' key={section.id}>
						<div className='mb-3 flex items-center justify-between'>
							<Button
								className='-translate-x-3 flex items-center gap-2 p-0'
								onClick={() => toggleSectionCollapse(section.id)}
								variant='ghost'
							>
								<h2
									className={`font-bold text-lg ${section.headingClassName ?? ''}`.trim()}
								>
									{section.label}{' '}
									<span className='text-muted-foreground'>
										({section.entries.length})
									</span>
								</h2>
								<ChevronDown
									className={`h-5 w-5 transition-transform ${section.isCollapsed ? '-rotate-90' : ''}`}
								/>
							</Button>
						</div>

						{!section.isCollapsed &&
							(section.entries.length > 0 ? (
								<MasonryLayout
									estimateItemSize={estimateItemSize}
									gap={16}
									getItemKey={getItemKey}
									items={section.entries}
									minItemWidth={MIN_WIDTH}
									overscan={5}
									renderItem={renderItem}
								/>
							) : (
								<p className='text-muted-foreground text-sm italic'>
									{section.emptyMessage}
								</p>
							))}
					</div>
				))}
			</div>
		</div>
	)
}
