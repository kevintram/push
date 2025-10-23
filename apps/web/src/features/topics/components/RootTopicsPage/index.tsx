import {
	useInsertMutation,
	useQuery
} from '@supabase-cache-helpers/postgrest-react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Archive, Check, Inbox, Plus, SquareLibrary, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import { CreateTopicDialog } from '~/features/topics/components/CreateTopicDialog'
import { useTopicsWithRelationships } from '~/features/topics/hooks/useTopicsWithRelationships'
import type { Tables } from '~/types/database.types'
import type { Topic } from '~/types/topics.types'
import { supabase } from '~/utils/supabase'
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
	const [activeFilters, setActiveFilters] = useState<Array<FilterId>>([])
	const navigate = useNavigate()

	// Query 1: All topics
	const { data: allTopics, isLoading: topicsLoading } = useQuery<
		Array<Tables<'topics'>>
	>(
		supabase
			.from('topics')
			.select('*')
			.order('inserted_at', { ascending: false })
	)

	// Query 2: All descendant IDs (topics that have parents)
	const { data: descendants, isLoading: descendantsLoading } = useQuery<
		Array<{ descendant: number }>
	>(supabase.from('topics_closure').select('descendant').eq('depth', 1))

	// Filter: Root topics = topics NOT in descendants
	const rootTopics = useMemo(() => {
		if (!(allTopics && descendants)) return []
		const descendantIds = new Set(descendants.map(d => d.descendant))
		return allTopics.filter(topic => !descendantIds.has(topic.id))
	}, [allTopics, descendants])

	// Get root topic IDs
	const rootTopicIds = useMemo(() => rootTopics.map(t => t.id), [rootTopics])

	// Enrich root topics with relationships
	const { topics: enrichedTopics, isLoading: relationshipsLoading } =
		useTopicsWithRelationships(rootTopicIds)

	const isLoading = topicsLoading || descendantsLoading || relationshipsLoading

	const { mutateAsync: insertTopicMutation } = useInsertMutation(
		supabase.from('topics'),
		['id'],
		'*',
		{
			onSuccess: data => {
				if (data?.[0]) {
					navigate({
						to: '/topics/{-$topicId}',
						params: { topicId: data[0].id.toString() }
					})
				}
			}
		}
	)

	const topics = enrichedTopics || []

	// Filter handler
	const handleFilterClick = useCallback((filterId: FilterId) => {
		setActiveFilters(prev => {
			const isActive = prev.includes(filterId)
			if (isActive) {
				return prev.filter(id => id !== filterId)
			}
			return [...prev, filterId]
		})
	}, [])

	const handleClearFilters = useCallback(() => {
		setActiveFilters([])
	}, [])

	// Filter topics based on active filters
	const filteredTopics = useMemo(() => {
		if (activeFilters.length === 0) {
			// Default: show non-archived and non-inboxed topics
			return topics.filter(topic => !(topic.is_archived || topic.is_inboxed))
		}

		// When filters are active, show topics matching ANY filter (OR logic)
		return topics.filter(topic => {
			if (activeFilters.includes('archived') && topic.is_archived) return true
			if (activeFilters.includes('inboxed') && topic.is_inboxed) return true
			return false
		})
	}, [topics, activeFilters])

	// Create filter badges
	const filters: Array<FilterBadge> = useMemo(
		() => [
			{
				id: 'inboxed' as const,
				label: 'Inbox',
				icon: <Inbox className='h-4 w-4' />,
				isActive: activeFilters.includes('inboxed'),
				onClick: () => handleFilterClick('inboxed')
			},
			{
				id: 'archived' as const,
				label: 'Archived',
				icon: <Archive className='h-4 w-4' />,
				isActive: activeFilters.includes('archived'),
				onClick: () => handleFilterClick('archived')
			}
		],
		[activeFilters, handleFilterClick]
	)

	const activeFilterBadges = filters.filter(f => f.isActive)
	const inactiveFilterBadges = filters.filter(f => !f.isActive)
	const hasActiveFilters = activeFilterBadges.length > 0

	type RenderedFilter =
		| { key: FilterId; type: 'filter'; filter: FilterBadge }
		| { key: 'clear'; type: 'clear' }

	const renderedFilters: Array<RenderedFilter> = hasActiveFilters
		? [
				...activeFilterBadges.map(filter => ({
					key: filter.id,
					type: 'filter' as const,
					filter
				})),
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

	const handleCreateTopic = useCallback(() => {
		insertTopicMutation([{}])
	}, [insertTopicMutation])

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
				topic={topic}
			/>
		),
		[handleTopicClick]
	)

	const getItemKey = useCallback((topic: Topic) => topic.id, [])

	const getTopics = useCallback(() => {
		fetch(`${import.meta.env.VITE_API_URL}/topics/`, {
			credentials: 'include'
		}).then(res => {
			return res.json()
		})
	}, [])
	
	const getTodos = useCallback(() => {
		fetch(`${import.meta.env.VITE_API_URL}/todos/`, {
			credentials: 'include'
		}).then(res => {
			return res.json()
		})
	}, [])

	if (isLoading) {
		return (
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto'>
					<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
						<div className='flex items-center justify-between'>
							<h1 className='font-bold text-xl'>Library</h1>
							<CreateTopicDialog
								showSidebar={false}
								submitButtonText='Create Topic'
								title='Add Topic'
								trigger={
									<Button size='icon' variant='ghost'>
										<Plus />
									</Button>
								}
							/>
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
				</div>
			</div>
		)
	}

	if (filteredTopics.length === 0) {
		const emptyMessage = hasActiveFilters
			? 'No topics match the selected filters'
			: topics.length === 0
				? 'No root topics yet'
				: 'No topics to show'

		return (
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto'>
					<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
						<div className='flex items-center justify-between'>
							<h1 className='font-bold text-xl'>Library</h1>
							<CreateTopicDialog
								showSidebar={false}
								submitButtonText='Create Topic'
								title='Add Topic'
								trigger={
									<Button size='icon' variant='ghost'>
										<Plus />
									</Button>
								}
							/>
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
				</div>
			</div>
		)
	}

	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>
				<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 bg-primary-foreground px-4 pt-4 pb-0'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<h1 className='font-bold text-xl'>Library</h1>
							<Button onClick={() => getTopics()}>Get Topics</Button>
							<Button onClick={() => getTodos()}>Get Todos</Button>
							<Button
								onClick={() => {
									document.location.href = `${import.meta.env.VITE_API_URL}/login`
								}}
							>
								Login
							</Button>
							<Button
								onClick={() => {
									document.location.href = `${import.meta.env.VITE_API_URL}/logout`
								}}
							>
								Logout
							</Button>
						</div>
						<CreateTopicDialog
							showSidebar={false}
							submitButtonText='Create Topic'
							title='Add Topic'
							trigger={
								<Button size='icon' variant='ghost'>
									<Plus />
								</Button>
							}
						/>
					</div>
					<div className='pt-2 pb-3'>
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
						items={filteredTopics}
						minItemWidth={MIN_CARD_WIDTH}
						renderItem={renderItem}
					/>
				</div>
			</div>
		</div>
	)
}
