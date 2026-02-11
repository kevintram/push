import { createFileRoute } from '@tanstack/react-router'
import { PracticeDetailPage } from '~/app/pages/PracticeDetailPage'

export const Route = createFileRoute('/_main/practices_/$practiceId/')({
	component: RouteComponent
})

function RouteComponent() {
	const { practiceId } = Route.useParams()
	return <PracticeDetailPage practiceId={practiceId} />
}
