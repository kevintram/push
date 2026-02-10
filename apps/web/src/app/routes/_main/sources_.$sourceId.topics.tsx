import { createFileRoute } from '@tanstack/react-router'
import { SourceDetailPage } from '~/app/pages/SourceDetailPage'

export const Route = createFileRoute('/_main/sources_/$sourceId/topics')({
	component: RouteComponent
})

function RouteComponent() {
	const { sourceId } = Route.useParams()
	return <SourceDetailPage activeTab='topics' sourceId={sourceId} />
}
