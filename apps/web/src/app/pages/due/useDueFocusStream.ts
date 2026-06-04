import { useMemo } from 'react'
import { useReviewCardQueuePage } from '~/modules/review-cards/api/getReviewCardQueue'
import type {
	ReviewCardQueueItem,
	ReviewFilter,
	ReviewFocusOrder
} from '~/modules/review-cards/types/review-card.types'

function hashSeed(seed: string): number {
	let hash = 0
	for (let index = 0; index < seed.length; index += 1) {
		hash = Math.imul(31, hash) + seed.charCodeAt(index)
	}
	return hash >>> 0
}

function seededRandom(seed: string) {
	let state = hashSeed(seed)
	return () => {
		state += 0x6d_2b_79_f5
		let value = state
		value = Math.imul(value ^ (value >>> 15), value | 1)
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
		return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
	}
}

function shuffleItems(
	items: Array<ReviewCardQueueItem>,
	seed: string
): Array<ReviewCardQueueItem> {
	const random = seededRandom(seed)
	const shuffled = [...items]

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1))
		const current = shuffled[index]
		shuffled[index] = shuffled[swapIndex]!
		shuffled[swapIndex] = current!
	}

	return shuffled
}

const EMPTY_ITEMS: Array<ReviewCardQueueItem> = []

function isCurrentDueItem(item: ReviewCardQueueItem) {
	const actionDays = item.action_days
	return actionDays != null && actionDays <= 0
}

function isFutureDueItem(item: ReviewCardQueueItem) {
	const actionDays = item.action_days
	return actionDays != null && actionDays > 0
}

function findItemByCardId(
	items: Array<ReviewCardQueueItem>,
	cardId?: number
): ReviewCardQueueItem | null {
	if (cardId == null) return null
	return items.find(item => item.card.id === cardId) ?? null
}

export function useDueFocusStream({
	activeReviewCardId,
	filter,
	includeFuture,
	order,
	shuffle
}: {
	activeReviewCardId?: number
	filter: ReviewFilter
	includeFuture: boolean
	order: ReviewFocusOrder
	shuffle?: string
}) {
	const queueQuery = useReviewCardQueuePage({
		filter,
		include_future: true,
		mode: 'focus'
	})
	const queueItems = queueQuery.data?.items ?? EMPTY_ITEMS
	const newItems = useMemo(
		() => queueItems.filter(item => item.queue_type === 'new'),
		[queueItems]
	)
	const dueItems = useMemo(
		() => queueItems.filter(item => item.queue_type !== 'new'),
		[queueItems]
	)

	const currentDueItems = useMemo(
		() => dueItems.filter(isCurrentDueItem),
		[dueItems]
	)
	const futureDueItems = useMemo(
		() => dueItems.filter(isFutureDueItem),
		[dueItems]
	)
	const defaultEligibleItems = useMemo(
		() => [...currentDueItems, ...newItems],
		[currentDueItems, newItems]
	)
	const activeFutureItem = findItemByCardId(futureDueItems, activeReviewCardId)
	const includesFutureDueItems = includeFuture || activeFutureItem != null
	const dueDateItems = useMemo(
		() =>
			includesFutureDueItems
				? [...currentDueItems, ...newItems, ...futureDueItems]
				: defaultEligibleItems,
		[
			currentDueItems,
			defaultEligibleItems,
			futureDueItems,
			includesFutureDueItems,
			newItems
		]
	)
	const streamItems = useMemo(() => {
		if (order !== 'random') return dueDateItems
		return shuffleItems(dueDateItems, shuffle ?? 'default')
	}, [dueDateItems, order, shuffle])
	const activeItem = findItemByCardId(streamItems, activeReviewCardId)
	const activeIndex =
		activeItem == null
			? -1
			: streamItems.findIndex(item => item.card.id === activeItem.card.id)
	const previousItem =
		activeIndex > 0 ? (streamItems[activeIndex - 1] ?? null) : null
	const nextItem =
		activeIndex >= 0 && activeIndex < streamItems.length - 1
			? (streamItems[activeIndex + 1] ?? null)
			: null

	return {
		activeIndex,
		activeItem,
		defaultEligibleItems,
		firstFutureItem: futureDueItems[0] ?? null,
		firstStreamItem: streamItems[0] ?? null,
		includesFutureDueItems,
		isLoading: queueQuery.isLoading,
		nextItem,
		previousItem,
		streamItems
	}
}
