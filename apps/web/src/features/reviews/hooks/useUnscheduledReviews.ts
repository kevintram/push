import { useQuery } from '@tanstack/react-query'
import { getReviews } from '../api'

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
	emptyMessage: 'No unscheduled reviews.'
}

export function useUnscheduledReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'unscheduled'],
		queryFn: () => getReviews({ scheduled: false, completed: false })
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
