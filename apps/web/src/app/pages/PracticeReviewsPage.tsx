import { useNavigate } from '@tanstack/react-router'
import { LoadingOrError } from '~/components/LoadingOrError'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface PracticeReviewsPageProps {
	practiceId: string
}

export function PracticeReviewsPage({ practiceId }: PracticeReviewsPageProps) {
	const navigate = useNavigate()
	const parsedPracticeId = Number.parseInt(practiceId, 10)
	const { practice, isLoading } = usePracticeWithRelationships(parsedPracticeId)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!practice) {
		return <LoadingOrError error={new Error('Practice not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={practice.id}
			entityName={practice.prompt}
			entityType='practice'
			onBack={() =>
				navigate({
					to: '/practices/$practiceId',
					params: { practiceId }
				})
			}
		/>
	)
}
