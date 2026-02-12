import { LoadingOrError } from '~/components/LoadingOrError'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { PracticeDetailNavBar } from '~/features/practices/components/PracticeDetail/PracticeDetailNavBar'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface PracticeReviewsPageProps {
	practiceId: string
}

export function PracticeReviewsPage({ practiceId }: PracticeReviewsPageProps) {
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
			entityType='practice'
			navbar={
				<PracticeDetailNavBar activeTab='reviews' practiceId={practice.id} />
			}
		/>
	)
}
