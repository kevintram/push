import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Topic, TopicSchema } from '~/models/review-topic.types'
import { apiFetch } from '~/utils/apiFetch'

type SectionDefinition = {
	id: 'unscheduled'
	label: string
	headingClassName?: string
	emptyMessage: string
}

const SECTION_DEFINITION: SectionDefinition = {
	id: 'unscheduled',
	label: 'Unscheduled',
	headingClassName: 'text-gray-600',
	emptyMessage: 'All topics have due dates.'
}

async function fetchUnscheduledTopics(): Promise<Array<Topic>> {
	// Fetch all topics and filter for those with due IS NULL
	// Backend doesn't have a direct parameter for null due dates
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/topics/?archived=false`
	)
	const data = await response.json()
	try {
		const allTopics = v.parse(v.array(TopicSchema), data)
		return allTopics.filter(topic => topic.due === null)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUnscheduledTopics() {
	const query = useQuery({
		queryKey: ['topics', 'unscheduled'],
		queryFn: fetchUnscheduledTopics
	})

	const section = {
		...SECTION_DEFINITION,
		entries: query.data ?? []
	}

	return {
		section,
		isLoading: query.isLoading,
		error: query.error
	}
}
