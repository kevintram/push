import { useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Button } from '~/components/ui/button'
import { usePracticeWithRelationships } from '~/features/practices/api/getPractice'
import { PracticeDetailNavBar } from '~/features/practices/components/PracticeDetail/PracticeDetailNavBar'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface PracticeReviewsPageProps {
	practiceId: string
}

export function PracticeReviewsPage({ practiceId }: PracticeReviewsPageProps) {
	const router = useRouter()
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
				<PracticeDetailNavBar
					activeTab='reviews'
					headerBeforeActions={
						<Button
							className='h-6 w-6 p-0'
							onClick={() => router.history.back()}
							size='sm'
							title='Go back'
							variant='ghost'
						>
							<ArrowLeft className='h-4 w-4' />
						</Button>
					}
					practiceId={practice.id}
				/>
			}
		/>
	)
}
