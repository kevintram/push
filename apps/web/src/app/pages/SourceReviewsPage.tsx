import { useNavigate } from '@tanstack/react-router'
import { LoadingOrError } from '~/components/LoadingOrError'
import { useSourceWithRelationships } from '~/features/sources/api/getSource'
import { EntityReviewsPageContent } from './EntityReviewsPageContent'

interface SourceReviewsPageProps {
	sourceId: string
}

export function SourceReviewsPage({ sourceId }: SourceReviewsPageProps) {
	const navigate = useNavigate()
	const parsedSourceId = Number.parseInt(sourceId, 10)
	const { source, isLoading } = useSourceWithRelationships(parsedSourceId)

	if (isLoading) {
		return <LoadingOrError />
	}

	if (!source) {
		return <LoadingOrError error={new Error('Source not found')} />
	}

	return (
		<EntityReviewsPageContent
			entityId={source.id}
			entityName={source.title}
			entityType='source'
			onBack={() =>
				navigate({
					to: '/sources/$sourceId',
					params: { sourceId }
				})
			}
		/>
	)
}
