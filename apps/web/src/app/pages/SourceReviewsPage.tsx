import { useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useCallback } from 'react'
import { LoadingOrError } from '~/components/LoadingOrError'
import { Button } from '~/components/ui/button'
import { useSourceWithRelationships } from '~/features/sources/api/getSource'
import { SourceDetailNavBar } from '~/features/sources/components/SourceDetail/SourceDetailNavBar'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface SourceReviewsPageProps {
	sourceId: string
}

export function SourceReviewsPage({ sourceId }: SourceReviewsPageProps) {
	const navigate = useNavigate()
	const router = useRouter()
	const parsedSourceId = Number.parseInt(sourceId, 10)
	const { source, isLoading } = useSourceWithRelationships(parsedSourceId)

	const handleSourceNavigate = useCallback(
		(nextSourceId: number) => {
			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: nextSourceId.toString() }
			})
		},
		[navigate]
	)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!source) {
		return <LoadingOrError error={new Error('Source not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={source.id}
			entityType='source'
			navbar={
				<SourceDetailNavBar
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
					onParentSelect={handleSourceNavigate}
					source={source}
				/>
			}
		/>
	)
}
