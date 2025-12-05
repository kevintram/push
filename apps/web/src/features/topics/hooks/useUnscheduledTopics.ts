import { useQuery } from '@tanstack/react-query'
import { getTopics } from '../api/getTopics'

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

export function useUnscheduledTopics() {
	const query = useQuery({
		queryKey: ['topics', 'unscheduled'],
		queryFn: async () => {
			const allTopics = await getTopics({ archived: false, srsEnabled: true })
			return allTopics.filter(topic => topic.due === null)
		}
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
