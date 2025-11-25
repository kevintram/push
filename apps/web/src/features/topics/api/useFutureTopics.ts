import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type FutureSection = {
	id: string
	label: string
	entries: Array<Topic>
}

async function fetchFutureTopics(): Promise<Array<Topic>> {
	const futureStartDate = dayjs().add(8, 'day').format('YYYY-MM-DD')

	// Fetch topics with due >= today + 8 days
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/?due_after=${futureStartDate}`
	)
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

export function useFutureTopics() {
	const query = useQuery({
		queryKey: ['topics', 'future'],
		queryFn: fetchFutureTopics
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
		error: query.error
	}
}
