import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MasonryLayout } from '~/components/MasonryLayout'
import { Button } from '~/components/ui/Button'
import { useReviewTopicDialog } from '~/features/dialogs/hooks/useReviewTopicDialog'
import { useSectionedTopics } from '~/features/topics/api/useSectionedTopics'
import { TopicCard } from '~/features/topics/components/TopicCard'
import type { Topic } from '~/models/review-topic.types'
import { getCookie, removeCookie, setCookie } from '~/utils/cookies'
import {
	type SectionFilterStates,
	type SectionKey,
	useSectionedReviews
} from '../api'
import { ReviewItem } from './ReviewItem'
import { ReviewsPageHeader } from './ReviewsPageHeader'
import { ReviewsPageSkeleton } from './ReviewsPageSkeleton'

type ContentType = 'reviews' | 'topics'

type SubsectionState = {
	[sectionId: string]: {
		reviews: boolean // collapsed state
		topics: boolean // collapsed state
	}
}

const MIN_TOPIC_WIDTH = 280
const MIN_TOPIC_HEIGHT = 96
const CONTENT_FILTER_COOKIE_KEY = 'reviews-content-filters'
const SECTION_FILTER_COOKIE_KEY = 'reviews-section-filters'

export function ReviewsPage() {
	// Clean up old cookie keys on first mount
	useEffect(() => {
		removeCookie('due-todo-section-states')
		removeCookie('due-topic-section-states')
		removeCookie('due-content-filters') // Clean up old content filters
		removeCookie('due-section-filters') // Clean up old section filters
	}, [])

	// Shared section filter state (applies to both reviews and topics)
	const [sectionFilterStates, setSectionFilterStates] =
		useState<SectionFilterStates>(() => {
			const saved = getCookie<SectionFilterStates>(SECTION_FILTER_COOKIE_KEY)
			return (
				saved ?? {
					overdue: { isActive: false },
					today: { isActive: false },
					tomorrow: { isActive: false },
					nextSevenDays: { isActive: false },
					future: { isActive: false },
					unscheduled: { isActive: false },
					logbook: { isActive: false }
				}
			)
		})

	// Save section filters to cookie whenever they change
	useEffect(() => {
		setCookie(SECTION_FILTER_COOKIE_KEY, sectionFilterStates)
	}, [sectionFilterStates])

	const {
		filteredSections: reviewSections,
		filters: reviewFilters,
		toggleSectionCollapse: toggleReviewSectionCollapse,
		isLoading: reviewsLoading
	} = useSectionedReviews({ externalFilterStates: sectionFilterStates })

	const {
		filteredSections: topicSections,
		toggleSectionCollapse: toggleTopicSectionCollapse,
		isLoading: topicsLoading
	} = useSectionedTopics({ externalFilterStates: sectionFilterStates })

	const { openReviewDialog, openTopicDialog } = useReviewTopicDialog()

	// Auto-deactivate overdue filter when no overdue items exist
	useEffect(() => {
		if (!sectionFilterStates.overdue.isActive) return

		const hasOverdueReviews = reviewSections.some(
			s => s.id === 'overdue' && s.entries.length > 0
		)
		const hasOverdueTopics = topicSections.some(
			s => s.id === 'overdue' && s.entries.length > 0
		)

		if (!(hasOverdueReviews || hasOverdueTopics)) {
			setSectionFilterStates(
				(prev: SectionFilterStates): SectionFilterStates => ({
					...prev,
					overdue: { isActive: false }
				})
			)
		}
	}, [sectionFilterStates.overdue.isActive, reviewSections, topicSections])

	// Content type filter state (empty = show all, like section filters)
	const [activeContentTypes, setActiveContentTypes] = useState<
		Set<ContentType>
	>(() => {
		const saved = getCookie<Array<ContentType>>(CONTENT_FILTER_COOKIE_KEY)
		return saved ? new Set(saved) : new Set()
	})

	// Save content filters to cookie whenever they change
	useEffect(() => {
		setCookie(CONTENT_FILTER_COOKIE_KEY, Array.from(activeContentTypes))
	}, [activeContentTypes])

	// Subsection collapse state
	const [subsectionStates, setSubsectionStates] = useState<SubsectionState>({})

	const handleReviewClick = useCallback(
		(reviewId: number) => {
			openReviewDialog(reviewId)
		},
		[openReviewDialog]
	)

	const handleTopicClick = useCallback(
		(topic: Topic) => {
			openTopicDialog(topic.id)
		},
		[openTopicDialog]
	)

	const toggleContentType = useCallback((type: ContentType) => {
		setActiveContentTypes(prev => {
			const newSet = new Set(prev)
			if (newSet.has(type)) {
				newSet.delete(type)
			} else {
				newSet.add(type)
			}
			return newSet
		})
	}, [])

	const clearContentTypeFilters = useCallback(() => {
		setActiveContentTypes(new Set())
	}, [])

	// Section filter handlers
	const handleFilterClick = useCallback((filterId: SectionKey) => {
		setSectionFilterStates((prev: SectionFilterStates): SectionFilterStates => {
			const isActive = prev[filterId].isActive
			const isLogbookActive = prev.logbook.isActive

			// If clicking 'logbook', only show logbook
			if (filterId === 'logbook') {
				return Object.fromEntries(
					Object.entries(prev).map(([key]) => [
						key,
						{ isActive: key === 'logbook' ? !isActive : false }
					])
				) as SectionFilterStates
			}

			// If logbook is currently active and clicking another filter, replace with that filter
			if (isLogbookActive) {
				return Object.fromEntries(
					Object.entries(prev).map(([key]) => [
						key,
						{ isActive: key === filterId }
					])
				) as SectionFilterStates
			}

			// Toggle the clicked filter
			return {
				...prev,
				[filterId]: { isActive: !isActive }
			}
		})
	}, [])

	const handleClearAllFilters = useCallback(() => {
		setSectionFilterStates(
			(prev: SectionFilterStates): SectionFilterStates =>
				Object.fromEntries(
					Object.entries(prev).map(([key]) => [key, { isActive: false }])
				) as SectionFilterStates
		)
	}, [])

	const toggleSubsection = useCallback(
		(sectionId: string, type: ContentType) => {
			setSubsectionStates(prev => ({
				...prev,
				[sectionId]: {
					reviews: prev[sectionId]?.reviews ?? false,
					topics: prev[sectionId]?.topics ?? false,
					[type]: !(prev[sectionId]?.[type] ?? false)
				}
			}))
		},
		[]
	)

	const estimateTopicSize = useCallback((topic: Topic) => {
		const baseHeight = 80
		const lineHeight = 10
		const numCharsPerLine = 30
		const newLine = 10

		const nameHeight =
			Math.floor(topic.name.length / numCharsPerLine) * lineHeight
		const notesHeight =
			Math.floor(topic.notes.length / numCharsPerLine) * lineHeight

		const calculatedHeight = baseHeight + nameHeight + newLine + notesHeight

		return Math.max(calculatedHeight, MIN_TOPIC_HEIGHT)
	}, [])

	const renderTopicItem = useCallback(
		(topic: Topic) => {
			return (
				<TopicCard
					minHeight={MIN_TOPIC_HEIGHT}
					onTopicClick={handleTopicClick}
					topic={topic}
				/>
			)
		},
		[handleTopicClick]
	)

	const getTopicKey = useCallback((topic: Topic) => {
		return topic.id
	}, [])

	// Merge sections by matching IDs
	const mergedSections = useMemo(() => {
		// Create a map of all unique section IDs
		const sectionMap = new Map<
			string,
			{
				id: string
				label: string
				headingClassName?: string
				reviewsData?: (typeof reviewSections)[0]
				topicsData?: (typeof topicSections)[0]
			}
		>()

		// Add review sections
		for (const section of reviewSections) {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				reviewsData: section
			})
		}

		// Add or merge topic sections
		for (const section of topicSections) {
			const existing = sectionMap.get(section.id)
			if (existing) {
				existing.topicsData = section
			} else {
				sectionMap.set(section.id, {
					id: section.id,
					label: section.label,
					headingClassName: section.headingClassName,
					topicsData: section
				})
			}
		}

		// Convert to array and sort by predefined order
		const sectionOrder = [
			'overdue',
			'today',
			'tomorrow',
			'nextSevenDays',
			'future',
			'unscheduled',
			'logbook'
		]

		return Array.from(sectionMap.values()).sort((a, b) => {
			const aIndex = sectionOrder.indexOf(a.id)
			const bIndex = sectionOrder.indexOf(b.id)
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
		})
	}, [reviewSections, topicSections])

	// Merge section filters from both hooks, enriching with onClick handlers
	const sectionFilters = useMemo(() => {
		const isLogbookActive = sectionFilterStates.logbook.isActive

		return reviewFilters
			.map(filter => ({
				...filter,
				onClick: () => handleFilterClick(filter.id as SectionKey)
			}))
			.filter(filter => {
				// When logbook is active, hide all other filters
				if (isLogbookActive && filter.id !== 'logbook') {
					return false
				}
				// When any other filter is active, hide logbook
				const hasOtherActiveFilters = Object.entries(sectionFilterStates).some(
					([id, state]: [string, { isActive: boolean }]) =>
						id !== 'logbook' && state.isActive
				)
				if (hasOtherActiveFilters && filter.id === 'logbook') {
					return false
				}
				return true
			})
	}, [reviewFilters, sectionFilterStates, handleFilterClick])

	const contentTypeFilters = useMemo(
		() => [
			{
				id: 'reviews' as const,
				label: 'Reviews',
				isActive: activeContentTypes.has('reviews'),
				onClick: () => toggleContentType('reviews')
			},
			{
				id: 'topics' as const,
				label: 'Topics',
				isActive: activeContentTypes.has('topics'),
				onClick: () => toggleContentType('topics')
			}
		],
		[activeContentTypes, toggleContentType]
	)

	if (reviewsLoading || topicsLoading) {
		return <ReviewsPageSkeleton />
	}

	return (
		<div className='scrollbar-track-transparent relative flex h-full w-full flex-col'>
			<div className='flex h-full flex-col overflow-auto bg-primary-foreground'>
				<ReviewsPageHeader
					contentTypeFilters={contentTypeFilters}
					onClearContentTypeFilters={clearContentTypeFilters}
					onClearFilters={handleClearAllFilters}
					sectionFilters={sectionFilters}
				/>
				<div className='px-6'>
					{mergedSections.map((section, index) => {
						const prev = index > 0 ? mergedSections[index - 1] : undefined
						const reviewEntries = section.reviewsData?.entries ?? []
						const topicEntries = section.topicsData?.entries ?? []
						const totalCount = reviewEntries.length + topicEntries.length

						// Skip section if both subsections are empty
						if (totalCount === 0) return null

						const isSectionCollapsed =
							section.reviewsData?.isCollapsed ??
							section.topicsData?.isCollapsed ??
							false
						const prevCollapsed =
							prev?.reviewsData?.isCollapsed ??
							prev?.topicsData?.isCollapsed ??
							false

						return (
							<div
								className={`mb-2 ${prevCollapsed ? '' : 'mt-12'}`}
								key={section.id}
							>
								<div className='flex items-center justify-between bg-primary-foreground'>
									<Button
										className='-translate-x-3 flex items-center gap-2 p-0'
										onClick={() => {
											if (section.reviewsData)
												toggleReviewSectionCollapse(
													section.id as import('../api').SectionKey
												)
											if (section.topicsData)
												toggleTopicSectionCollapse(
													section.id as import('~/features/topics/api/useSectionedTopics').TopicSectionKey
												)
										}}
										variant='ghost'
									>
										<h2
											className={`font-bold text-lg ${section.headingClassName ?? ''}`.trim()}
										>
											{section.label}
										</h2>
										<ChevronDown
											className={`h-5 w-5 transition-transform ${isSectionCollapsed ? '-rotate-90' : ''}`}
										/>
									</Button>
								</div>

								{!isSectionCollapsed && (
									<div className='mt-2 ml-2 flex flex-col gap-4 border-border border-l-2 pl-4'>
										{/* Reviews Subsection */}
										{(activeContentTypes.size === 0 ||
											activeContentTypes.has('reviews')) && (
											<div>
												<Button
													className='-translate-x-3 flex items-center gap-2 p-0'
													onClick={() =>
														toggleSubsection(section.id, 'reviews')
													}
													variant='ghost'
												>
													<h3 className='font-semibold text-md'>
														Reviews{' '}
														<span className='text-muted-foreground'>
															({reviewEntries.length})
														</span>
													</h3>
													<ChevronDown
														className={`h-4 w-4 transition-transform ${subsectionStates[section.id]?.reviews ? '-rotate-90' : ''}`}
													/>
												</Button>
												{!subsectionStates[section.id]?.reviews && (
													<div>
														{reviewEntries.map(entry => (
															<ReviewItem
																entry={entry}
																key={entry.id}
																onReviewClick={handleReviewClick}
															/>
														))}
													</div>
												)}
											</div>
										)}

										{/* Topics Subsection */}
										{(activeContentTypes.size === 0 ||
											activeContentTypes.has('topics')) && (
											<div>
												<Button
													className='-translate-x-3 flex items-center gap-2 p-0'
													onClick={() => toggleSubsection(section.id, 'topics')}
													variant='ghost'
												>
													<h3 className='font-semibold text-md'>
														Topics{' '}
														<span className='text-muted-foreground'>
															({topicEntries.length})
														</span>
													</h3>
													<ChevronDown
														className={`h-4 w-4 transition-transform ${subsectionStates[section.id]?.topics ? '-rotate-90' : ''}`}
													/>
												</Button>
												{!subsectionStates[section.id]?.topics && (
													<div>
														{topicEntries.length > 0 ? (
															<MasonryLayout
																estimateItemSize={estimateTopicSize}
																gap={16}
																getItemKey={getTopicKey}
																items={topicEntries}
																minItemWidth={MIN_TOPIC_WIDTH}
																overscan={5}
																renderItem={renderTopicItem}
															/>
														) : null}
													</div>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
