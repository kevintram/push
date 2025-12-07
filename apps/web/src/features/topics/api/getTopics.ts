import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

export type GetTopicsParams = {
	root?: boolean
	inboxed?: boolean
	archived?: boolean
	srsEnabled?: boolean
	order?: 'desc' | 'asc'
	limit?: number
	dueBefore?: string
	dueAfter?: string
}

export async function getTopics(
	params: GetTopicsParams = {}
): Promise<Array<Topic>> {
	const searchParams = new URLSearchParams()

	if (params.root !== undefined) {
		searchParams.append('root', String(params.root))
	}

	if (params.inboxed !== undefined) {
		searchParams.append('inboxed', String(params.inboxed))
	}

	if (params.archived !== undefined) {
		searchParams.append('archived', String(params.archived))
	}

	if (params.order !== undefined) {
		searchParams.append('order', params.order)
	}

	if (params.limit !== undefined) {
		searchParams.append('limit', String(params.limit))
	}

	if (params.dueBefore !== undefined) {
		searchParams.append('due_before', params.dueBefore)
	}

	if (params.dueAfter !== undefined) {
		searchParams.append('due_after', params.dueAfter)
	}

	if (params.srsEnabled !== undefined) {
		searchParams.append('srs_enabled', String(params.srsEnabled))
	}

	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
	)

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(TopicSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export type TodayTopicSectionKey = 'overdue' | 'today'

type SectionDefinition = {
	id: TodayTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITIONS: Array<SectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue topics."
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'No topics due today.'
	}
]

export function useTodayTopics() {
	const query = useQuery({
		queryKey: ['topics', 'today'],
		queryFn: () => {
			const today = dayjs().format('YYYY-MM-DD')
			return getTopics({ dueBefore: today, archived: false, srsEnabled: true })
		}
	})

	const todayDateStr = useMemo(() => {
		return dayjs().format('YYYY-MM-DD')
	}, [])

	const sections = useMemo(() => {
		const topics = query.data ?? []

		const overdueList: Array<Topic> = []
		const todayList: Array<Topic> = []

		for (const topic of topics) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Today
			if (dueDate === todayDateStr) {
				todayList.push(topic)
			}
			// Overdue
			else if (dueDate < todayDateStr) {
				overdueList.push(topic)
			}
		}

		return SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'overdue' ? overdueList : todayList

			return {
				...def,
				entries
			}
		})
	}, [query.data, todayDateStr])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

export type SoonTopicSectionKey = 'tomorrow' | 'nextSevenDays'

type SoonSectionDefinition = {
	id: SoonTopicSectionKey
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SOON_SECTION_DEFINITIONS: Array<SoonSectionDefinition> = [
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No topics due tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No topics due in the next few days.'
	}
]

export function useSoonTopics() {
	const query = useQuery({
		queryKey: ['topics', 'soon'],
		queryFn: () => {
			const nextWeekDate = dayjs().add(7, 'day').format('YYYY-MM-DD')
			const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
			return getTopics({
				dueAfter: tomorrow,
				dueBefore: nextWeekDate,
				archived: false,
				srsEnabled: true
			})
		}
	})

	// Centralized date boundary calculations
	const dateBoundaries = useMemo(() => {
		const newDate = new Date()

		const todayDateStr = dayjs(newDate).format('YYYY-MM-DD')

		const tomorrowDate = new Date()
		tomorrowDate.setDate(tomorrowDate.getDate() + 1)
		const tomorrowDateStr = dayjs(tomorrowDate).format('YYYY-MM-DD')

		const nextWeekDate = new Date()
		nextWeekDate.setDate(nextWeekDate.getDate() + 7)
		const nextWeekDateStr = dayjs(nextWeekDate).format('YYYY-MM-DD')

		const dayAfterTomorrowDate = new Date()
		dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2)
		const dayAfterTomorrowDateStr =
			dayjs(dayAfterTomorrowDate).format('YYYY-MM-DD')

		return {
			todayDateStr,
			tomorrowDateStr,
			nextWeekDateStr,
			dayAfterTomorrowDateStr
		}
	}, [])

	const sections = useMemo(() => {
		const topics = query.data ?? []

		const tomorrowList: Array<Topic> = []
		const nextSevenDaysList: Array<Topic> = []

		for (const topic of topics) {
			if (!topic.due) {
				// Skip unscheduled topics (shouldn't happen with our query but be safe)
				continue
			}

			const dueDate = topic.due

			// Tomorrow
			if (dueDate === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(topic)
			}
			// Next 7 Days
			else if (
				dueDate >= dateBoundaries.dayAfterTomorrowDateStr &&
				dueDate <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(topic)
			}
		}

		return SOON_SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'tomorrow' ? tomorrowList : nextSevenDaysList

			return {
				...def,
				entries
			}
		})
	}, [query.data, dateBoundaries])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}

type UnscheduledSectionDefinition = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
}

const UNSCHEDULED_SECTION_DEFINITION: UnscheduledSectionDefinition = {
	id: 'unscheduled',
	label: 'Unscheduled',
	headingClassName: 'text-gray-600',
	emptyMessage: 'All topics have due dates.'
}

export function useUnscheduledTopics() {
	const query = useQuery({
		queryKey: ['topics', 'unscheduled'],
		queryFn: async () => {
			const allTopics = await getTopics({ archived: false, srsEnabled: true })
			return allTopics.filter(topic => topic.due === null)
		}
	})

	const section = {
		...UNSCHEDULED_SECTION_DEFINITION,
		entries: query.data ?? []
	}

	return {
		section,
		isLoading: query.isLoading,
		error: query.error
	}
}

export function useInboxTopics() {
	return useQuery({
		queryKey: ['topics', 'inbox'],
		queryFn: () => getTopics({ inboxed: true, archived: false })
	})
}

type FutureSection = {
	id: string
	label: string
	entries: Array<Topic>
}

export function useFutureTopics(options?: { enabled?: boolean }) {
	const query = useQuery({
		queryKey: ['topics', 'future'],
		queryFn: () => {
			const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')
			return getTopics({
				dueAfter: futureStartDate,
				archived: false,
				srsEnabled: true
			})
		},
		enabled: options?.enabled ?? true
	})

	// Group topics by month
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		const monthlyGroups = new Map<string, Array<Topic>>()

		for (const topic of query.data) {
			const dueDate = topic.due

			// Skip topics without due date
			if (!dueDate) {
				continue
			}

			const monthKey = dayjs(dueDate).format('YYYY-MM')

			if (!monthlyGroups.has(monthKey)) {
				monthlyGroups.set(monthKey, [])
			}
			const group = monthlyGroups.get(monthKey)
			if (group) {
				group.push(topic)
			}
		}

		// Convert to array of sections, sorted by month ascending (earliest first)
		const sectionsArray: Array<FutureSection> = Array.from(
			monthlyGroups.entries()
		).map(([monthKey, entries]) => ({
			id: monthKey,
			label: dayjs(`${monthKey}-01`).format('MMMM YYYY'),
			entries
		}))

		// Sort by month key ascending (earliest month first)
		sectionsArray.sort((a, b) => a.id.localeCompare(b.id))

		return sectionsArray
	}, [query.data])

	return {
		sections,
		isLoading: query.isLoading,
		isFetched: query.isFetched,
		error: query.error
	}
}
