import { useQuery } from '@tanstack/react-query'
import * as v from 'valibot'
import { type Review, ReviewSchema } from '~/models/review-topic.types'
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
	emptyMessage: 'No unscheduled reviews.'
}

async function fetchUnscheduledReviews(): Promise<Array<Review>> {
	// Fetch reviews where effective_date IS NULL (unscheduled) and not completed
	const response = await apiFetch(
		`${import.meta.env.VITE_API_URL}/reviews/?scheduled=false&completed=false`
	)
	const data = await response.json()
	try {
		return v.parse(v.array(ReviewSchema), data)
	} catch (error) {
		if (v.isValiError(error)) {
			throw new Error(`Validation failed: ${error.message}`)
		}
		throw error
	}
}

export function useUnscheduledReviews() {
	const query = useQuery({
		queryKey: ['reviews', 'unscheduled'],
		queryFn: fetchUnscheduledReviews
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
