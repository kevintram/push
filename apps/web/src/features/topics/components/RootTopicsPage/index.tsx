import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Archive, Check, Inbox, Plus, SquareLibrary, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { useCreateTopic } from '~/features/topics/api/useCreateTopic'
import { useRootTopics } from '~/features/topics/api/useRootTopics'
import { TopicDialog } from '~/features/topics/components/TopicDialog'
import { TopicContext } from '~/features/topics/stores/SelectedTopicContext'
import type { Topic } from '~/models/todo-topic.types'
import { TopicCard } from '../TopicCard'

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
	const navigate = useNavigate()
	const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

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

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear'; type: 'clear' }

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
		setSelectedTopic(newTopic)
		setIsDialogOpen(true)
	}, [createTopicAsync])

	const handleTopicChange = useCallback((topic: Topic) => {
		setSelectedTopic(topic)
	}, [])

	const handleDialogOpenChange = useCallback((open: boolean) => {
		setIsDialogOpen(open)
		if (!open) {
			setSelectedTopic(null)
		}
	}, [])

	const contextValue = useMemo(
		() => ({
			topic: selectedTopic ?? undefined,
			onTopicChange: handleTopicChange
		}),
		[selectedTopic, handleTopicChange]
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			navigate({
				to: '/topics/{-$topicId}',
				params: { topicId: topic.id.toString() }
			})
		},
		[navigate]
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

	if (isLoading) {
		return (
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto'>
					<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
						<div className='flex items-center justify-between'>
							<h1 className='font-bold text-xl'>Library</h1>
							<Button onClick={handleCreateTopic} size='icon' variant='ghost'>
								<Plus />
							</Button>
						</div>
						<div className='py-2'>
							<motion.div
								className='flex flex-wrap items-center gap-2'
								layout={true}
								transition={{ duration: 0.2, ease: 'easeInOut' }}
							>
								{renderedFilters.map(item => {
									if (item.type === 'clear') {
										return (
											<motion.div
												key='clear'
												layout={true}
												transition={{ duration: 0.2, ease: 'easeInOut' }}
											>
												<Badge
													aria-label='Clear filters'
													className='flex cursor-pointer items-center gap-1'
													onClick={handleClearFilters}
													variant='secondary'
												>
													<X className='h-4 w-4' />
												</Badge>
											</motion.div>
										)
									}

									return (
										<motion.div
											key={item.key}
											layout={true}
											transition={{ duration: 0.2, ease: 'easeInOut' }}
										>
											<Badge
												className='flex cursor-pointer items-center gap-1'
												onClick={item.filter.onClick}
												variant={item.filter.isActive ? 'default' : 'outline'}
											>
												{item.filter.isActive ? (
													<Check aria-hidden='true' className='h-4 w-4' />
												) : (
													item.filter.icon
												)}
												{item.filter.label}
											</Badge>
										</motion.div>
									)
								})}
							</motion.div>
						</div>
					</div>
					<div className='px-6 pt-2'>
						<p className='text-muted-foreground'>Loading topics...</p>
					</div>

					<TopicContext value={contextValue}>
						<TopicDialog
							onOpenChange={handleDialogOpenChange}
							open={isDialogOpen}
						/>
					</TopicContext>
				</div>
			</div>
		)
	}

	if (topics.length === 0) {
		const emptyMessage = hasActiveFilter
			? 'No topics match the selected filter'
			: 'No root topics yet'

		return (
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto'>
					<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
						<div className='flex items-center justify-between'>
							<h1 className='font-bold text-xl'>Library</h1>
							<Button onClick={handleCreateTopic} size='icon' variant='ghost'>
								<Plus />
							</Button>
						</div>
						<div className='py-2'>
							<motion.div
								className='flex flex-wrap items-center gap-2'
								layout={true}
								transition={{ duration: 0.2, ease: 'easeInOut' }}
							>
								{renderedFilters.map(item => {
									if (item.type === 'clear') {
										return (
											<motion.div
												key='clear'
												layout={true}
												transition={{ duration: 0.2, ease: 'easeInOut' }}
											>
												<Badge
													aria-label='Clear filters'
													className='flex cursor-pointer items-center gap-1'
													onClick={handleClearFilters}
													variant='secondary'
												>
													<X className='h-4 w-4' />
												</Badge>
											</motion.div>
										)
									}

									return (
										<motion.div
											key={item.key}
											layout={true}
											transition={{ duration: 0.2, ease: 'easeInOut' }}
										>
											<Badge
												className='flex cursor-pointer items-center gap-1'
												onClick={item.filter.onClick}
												variant={item.filter.isActive ? 'default' : 'outline'}
											>
												{item.filter.isActive ? (
													<Check aria-hidden='true' className='h-4 w-4' />
												) : (
													item.filter.icon
												)}
												{item.filter.label}
											</Badge>
										</motion.div>
									)
								})}
							</motion.div>
						</div>
					</div>
					<div className='px-6 pt-2'>
						<div className='text-center'>
							<SquareLibrary className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
							<p className='mb-2 text-muted-foreground'>{emptyMessage}</p>
							{topics.length === 0 && (
								<Button onClick={handleCreateTopic} variant='outline'>
									<Plus className='mr-2 h-4 w-4' />
									Create your first topic
								</Button>
							)}
						</div>
					</div>

					<TopicContext value={contextValue}>
						<TopicDialog
							onOpenChange={handleDialogOpenChange}
							open={isDialogOpen}
						/>
					</TopicContext>
				</div>
			</div>
		)
	}

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
					<div className='flex items-center justify-between'>
						<h1 className='font-bold text-xl'>Library</h1>
						<Button onClick={handleCreateTopic} size='icon' variant='ghost'>
							<Plus />
						</Button>
					</div>
					<div className='py-2'>
						<motion.div
							className='flex flex-wrap items-center gap-2'
							layout={true}
							transition={{ duration: 0.2, ease: 'easeInOut' }}
						>
							{renderedFilters.map(item => {
								if (item.type === 'clear') {
									return (
										<motion.div
											key='clear'
											layout={true}
											transition={{ duration: 0.2, ease: 'easeInOut' }}
										>
											<Badge
												aria-label='Clear filters'
												className='flex cursor-pointer items-center gap-1'
												onClick={handleClearFilters}
												variant='secondary'
											>
												<X className='h-4 w-4' />
											</Badge>
										</motion.div>
									)
								}

								return (
									<motion.div
										key={item.key}
										layout={true}
										transition={{ duration: 0.2, ease: 'easeInOut' }}
									>
										<Badge
											className='flex cursor-pointer items-center gap-1'
											onClick={item.filter.onClick}
											variant={item.filter.isActive ? 'default' : 'outline'}
										>
											{item.filter.isActive ? (
												<Check aria-hidden='true' className='h-4 w-4' />
											) : (
												item.filter.icon
											)}
											{item.filter.label}
										</Badge>
									</motion.div>
								)
							})}
						</motion.div>
					</div>
				</div>

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

				<TopicContext value={contextValue}>
					<TopicDialog
						onOpenChange={handleDialogOpenChange}
						open={isDialogOpen}
					/>
				</TopicContext>
			</div>
		</div>
	)
}
