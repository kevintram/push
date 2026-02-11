import { createFileRoute } from '@tanstack/react-router'
import { SourceReviewsPage } from '~/app/pages/SourceReviewsPage'

export const Route = createFileRoute('/_main/sources_/$sourceId/reviews')({
	component: RouteComponent
})

function RouteComponent() {
	const { sourceId } = Route.useParams()
	return <SourceReviewsPage sourceId={sourceId} />
}
