import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { apiFetch } from '~/utils/apiFetch'
import type {
	FutureEntrySection,
	GetReviewEntriesFilters,
	LogbookEntrySection,
	SoonEntrySection,
	TodayEntrySection,
	UnscheduledEntrySection
} from '../types/api.types'
import { ReviewEntrySchema } from '../types/review.schemas'
import type { ReviewEntry } from '../types/review.types'
import { reviewEntryKeys } from './queryKeys'

export async function getReviewEntries(filters?: GetReviewEntriesFilters) {
	const params = new URLSearchParams()

	if (filters?.topicId !== undefined) {
		params.append('topic_id', filters.topicId.toString())
	}

	if (filters?.effectiveDateBefore !== undefined) {
		params.append('effective_date_before', filters.effectiveDateBefore)
	}

	if (filters?.effectiveDateAfter !== undefined) {
		params.append('effective_date_after', filters.effectiveDateAfter)
	}

	if (filters?.scheduled !== undefined) {
		params.append('scheduled', String(filters.scheduled))
	}

	if (filters?.completed !== undefined) {
		params.append('completed', String(filters.completed))
	}

	const url = `${import.meta.env.VITE_API_URL}/review-entries/${params.toString() ? `?${params.toString()}` : ''}`

	const response = await apiFetch(url, {
		method: 'GET'
	})

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`)
	}

	const data = await response.json()
	try {
		return v.parse(v.array(ReviewEntrySchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

type TodaySectionDefinition = {
	id: 'overdue' | 'today'
	label: string
	headingClassName?: string
	emptyMessage: string
}

const TODAY_SECTION_DEFINITIONS: Array<TodaySectionDefinition> = [
	{
		id: 'overdue',
		label: 'Overdue',
		headingClassName: 'text-red-600',
		emptyMessage: "You're all caught up—no overdue reviews."
	},
	{
		id: 'today',
		label: 'Today',
		emptyMessage: 'Nothing scheduled for today.'
	}
]

export function useTodayReviewEntries() {
	const tomorrow = useMemo(() => dayjs().add(1, 'day').format('YYYY-MM-DD'), [])

	const query = useQuery({
		queryKey: reviewEntryKeys.list({ effectiveDateBefore: tomorrow }),
		queryFn: () => {
			return getReviewEntries({ effectiveDateBefore: tomorrow })
		}
	})

	const todayDateStr = useMemo(() => {
		return dayjs().format('YYYY-MM-DD')
	}, [])

	const sections = useMemo(() => {
		if (!query.data) {
			return TODAY_SECTION_DEFINITIONS.map(def => ({
				...def,
				entries: [] as Array<ReviewEntry>
			}))
		}

		const overdueList: Array<ReviewEntry> = []
		const todayList: Array<ReviewEntry> = []

		for (const entry of query.data) {
			if (entry.effective_date === null) {
				// Skip unscheduled entries
				continue
			}

			// Today: ALL entries (completed and uncompleted) with effective_date for today
			if (entry.effective_date === todayDateStr) {
				todayList.push(entry)
			}
			// Overdue: ONLY incomplete entries with effective_date before today
			else if (
				entry.data.completed_at === null &&
				entry.effective_date < todayDateStr
			) {
				overdueList.push(entry)
			}
		}

		return TODAY_SECTION_DEFINITIONS.map(def => {
			const entries = def.id === 'overdue' ? overdueList : todayList

			return {
				...def,
				entries
			}
		})
	}, [query.data, todayDateStr])

	return {
		sections: sections as Array<TodayEntrySection>,
		isLoading: query.isLoading,
		error: query.error
	}
}

type SoonSectionDefinition = {
	id: 'tomorrow' | 'nextSevenDays'
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SOON_SECTION_DEFINITIONS: Array<SoonSectionDefinition> = [
	{
		id: 'tomorrow',
		label: 'Tomorrow',
		emptyMessage: 'No reviews scheduled for tomorrow.'
	},
	{
		id: 'nextSevenDays',
		label: 'Next Few Days',
		emptyMessage: 'No reviews scheduled for the next few days.'
	}
]

export function useSoonReviewEntries() {
	const tomorrow = useMemo(() => dayjs().add(1, 'day').format('YYYY-MM-DD'), [])
	const nextWeekDate = useMemo(
		() => dayjs().add(7, 'day').format('YYYY-MM-DD'),
		[]
	)

	const query = useQuery({
		queryKey: reviewEntryKeys.list({
			effectiveDateAfter: tomorrow,
			effectiveDateBefore: nextWeekDate
		}),
		queryFn: () => {
			return getReviewEntries({
				effectiveDateAfter: tomorrow,
				effectiveDateBefore: nextWeekDate
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
		if (!query.data) {
			return SOON_SECTION_DEFINITIONS.map(def => ({
				...def,
				entries: [] as Array<ReviewEntry>
			}))
		}

		const tomorrowList: Array<ReviewEntry> = []
		const nextSevenDaysList: Array<ReviewEntry> = []

		for (const entry of query.data) {
			if (entry.effective_date === null) {
				// Skip unscheduled entries in "soon" view
				continue
			}

			// Tomorrow: ALL entries (completed and uncompleted) with effective_date for tomorrow
			if (entry.effective_date === dateBoundaries.tomorrowDateStr) {
				tomorrowList.push(entry)
			}
			// Next 7 Days: ALL entries (completed and uncompleted) with effective_date in next 7 days
			else if (
				entry.effective_date >= dateBoundaries.dayAfterTomorrowDateStr &&
				entry.effective_date <= dateBoundaries.nextWeekDateStr
			) {
				nextSevenDaysList.push(entry)
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
		sections: sections as Array<SoonEntrySection>,
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
	emptyMessage: 'No unscheduled reviews.'
}

export function useUnscheduledReviewEntries() {
	const query = useQuery({
		queryKey: reviewEntryKeys.list({ scheduled: false, completed: false }),
		queryFn: () => getReviewEntries({ scheduled: false, completed: false })
	})

	const section: UnscheduledEntrySection = {
		...UNSCHEDULED_SECTION_DEFINITION,
		entries: query.data ?? []
	}

	return {
		section,
		isLoading: query.isLoading,
		error: query.error
	}
}

export function useFutureReviewEntries(options?: { enabled?: boolean }) {
	const futureStartDate = useMemo(
		() => dayjs().add(8, 'day').format('YYYY-MM-DD'),
		[]
	)

	const query = useQuery({
		queryKey: reviewEntryKeys.list({
			effectiveDateAfter: futureStartDate,
			completed: false
		}),
		queryFn: () => {
			return getReviewEntries({
				effectiveDateAfter: futureStartDate,
				completed: false
			})
		},
		enabled: options?.enabled ?? true
	})

	// Group entries by month
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		const monthlyGroups = new Map<string, Array<ReviewEntry>>()

		for (const entry of query.data) {
			const effectiveDate = entry.effective_date

			// Skip entries without effective_date
			if (!effectiveDate) {
				continue
			}

			const monthKey = dayjs(effectiveDate).format('YYYY-MM')

			if (!monthlyGroups.has(monthKey)) {
				monthlyGroups.set(monthKey, [])
			}
			const group = monthlyGroups.get(monthKey)
			if (group) {
				group.push(entry)
			}
		}

		// Convert to array of sections, sorted by month ascending (earliest first)
		const sectionsArray: Array<FutureEntrySection> = Array.from(
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

export function useLogbookReviewEntries() {
	const yesterday = useMemo(
		() => dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
		[]
	)

	const query = useQuery({
		queryKey: reviewEntryKeys.list({
			effectiveDateBefore: yesterday,
			completed: true
		}),
		queryFn: () => {
			return getReviewEntries({
				effectiveDateBefore: yesterday,
				completed: true
			})
		}
	})

	// Group entries into Yesterday, Last Week, and Monthly sections
	const sections = useMemo(() => {
		if (!query.data) {
			return []
		}

		// Calculate date boundaries
		const today = dayjs()
		const yesterday = today.subtract(1, 'day')
		const yesterdayDateStr = yesterday.format('YYYY-MM-DD')

		// Last week: 6 days ago through 2 days ago (past 7 days excluding yesterday)
		const sixDaysAgo = today.subtract(6, 'day')
		const twoDaysAgo = today.subtract(2, 'day')
		const sixDaysAgoDateStr = sixDaysAgo.format('YYYY-MM-DD')
		const twoDaysAgoDateStr = twoDaysAgo.format('YYYY-MM-DD')

		// Categorize entries
		const yesterdayEntries: Array<ReviewEntry> = []
		const lastWeekEntries: Array<ReviewEntry> = []
		const monthlyGroups = new Map<string, Array<ReviewEntry>>()

		for (const entry of query.data) {
			const effectiveDate = entry.effective_date

			// Skip entries without effective_date
			if (!effectiveDate) {
				continue
			}

			// Yesterday section
			if (effectiveDate === yesterdayDateStr) {
				yesterdayEntries.push(entry)
			}
			// Last Week section (6 days ago through 2 days ago)
			else if (
				effectiveDate >= sixDaysAgoDateStr &&
				effectiveDate <= twoDaysAgoDateStr
			) {
				lastWeekEntries.push(entry)
			}
			// Monthly sections (everything else)
			else {
				const monthKey = dayjs(effectiveDate).format('YYYY-MM')

				if (!monthlyGroups.has(monthKey)) {
					monthlyGroups.set(monthKey, [])
				}
				const group = monthlyGroups.get(monthKey)
				if (group) {
					group.push(entry)
				}
			}
		}

		// Build sections array
		const sectionsArray: Array<LogbookEntrySection> = []

		// Add Yesterday section if it has entries
		if (yesterdayEntries.length > 0) {
			sectionsArray.push({
				id: 'yesterday',
				label: 'Yesterday',
				entries: yesterdayEntries
			})
		}

		// Add Last Week section if it has entries
		if (lastWeekEntries.length > 0) {
			sectionsArray.push({
				id: 'last-week',
				label: 'Last Week',
				entries: lastWeekEntries
			})
		}

		// Add monthly sections, sorted by date descending (most recent first)
		const monthlySections: Array<LogbookEntrySection> = Array.from(
			monthlyGroups.entries()
		).map(([monthKey, entries]) => ({
			id: monthKey,
			label: dayjs(`${monthKey}-01`).format('MMMM YYYY'),
			entries
		}))

		// Sort monthly sections by month key descending
		monthlySections.sort((a, b) => b.id.localeCompare(a.id))

		// Add monthly sections to the array
		sectionsArray.push(...monthlySections)

		return sectionsArray
	}, [query.data])

	return {
		sections,
		isLoading: query.isLoading,
		error: query.error
	}
}
