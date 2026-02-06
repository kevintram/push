import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { MasonryLayout } from '~/components/masonry-layout/MasonryLayout'
import { MIN_CARD_WIDTH } from './constants'

interface SearchResultsContainerProps<T> {
	/** Whether the search is currently loading */
	isLoading: boolean
	/** Whether there is an active search query */
	hasQuery: boolean
	/** The current search query (for display in empty state) */
	searchQuery: string
	/** The search results */
	results: Array<T>
	/** Function to render each result item */
	renderItem: (item: T, index: number, laneWidth: number) => ReactNode
	/** Function to estimate the height of each item */
	estimateItemSize: (item: T, index: number, laneWidth: number) => number
	/** Function to get a unique key for each item */
	getItemKey: (item: T) => number | string
	/** Scroll container element getter for virtualization */
	getScrollElement?: () => HTMLDivElement | null
	/** Gap between items in the masonry layout */
	gap?: number
	/** Minimum width of each card */
	minItemWidth?: number
	/** Whether to animate the container */
	animate?: boolean
	/** Custom empty message when no results and no query */
	emptyMessage?: string
	/** Custom loading message */
	loadingMessage?: string
	/** Custom label for recent items (when no query) */
	recentLabel?: string
}

export function SearchResultsContainer<T>({
	isLoading,
	hasQuery,
	searchQuery,
	results,
	renderItem,
	estimateItemSize,
	getItemKey,
	getScrollElement,
	gap = 16,
	minItemWidth = MIN_CARD_WIDTH,
	animate = true,
	emptyMessage = 'No results found',
	loadingMessage,
	recentLabel = 'Recent'
}: SearchResultsContainerProps<T>) {
	const hasResults = results.length > 0
	const isReady = !isLoading
	const isEmpty = !hasResults
	const showNoResultsWithQuery = hasQuery && isReady && isEmpty
	const showNoResultsWithoutQuery = !hasQuery && isReady && isEmpty

	const defaultLoadingMessage = hasQuery
		? 'Searching...'
		: 'Loading recent items...'

	const content = (
		<>
			{/* Loading State */}
			{isLoading && (
				<div className='flex items-center justify-center py-8 text-muted-foreground'>
					<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
					{loadingMessage ?? defaultLoadingMessage}
				</div>
			)}

			{/* No Results - With Query */}
			{showNoResultsWithQuery && (
				<div className='flex items-center justify-center py-8 text-muted-foreground'>
					No results found for "{searchQuery}"
				</div>
			)}

			{/* No Results - Without Query */}
			{showNoResultsWithoutQuery && (
				<div className='flex items-center justify-center py-8 text-muted-foreground'>
					{emptyMessage}
				</div>
			)}

			{/* Results Header */}
			{hasResults && (
				<div className='mb-2'>
					{!hasQuery && (
						<div className='mb-3 font-medium text-muted-foreground text-sm'>
							{recentLabel}
						</div>
					)}
				</div>
			)}

			{/* Results Grid */}
			{hasResults && (
				<MasonryLayout
					estimateItemSize={estimateItemSize}
					gap={gap}
					getItemKey={getItemKey}
					getScrollElement={getScrollElement}
					items={results}
					minItemWidth={minItemWidth}
					renderItem={renderItem}
				/>
			)}
		</>
	)

	if (animate) {
		return (
			<motion.div
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				initial={{ opacity: 0 }}
				key='search-results'
				transition={{ duration: 0.12 }}
			>
				{content}
			</motion.div>
		)
	}

	return <div>{content}</div>
}
