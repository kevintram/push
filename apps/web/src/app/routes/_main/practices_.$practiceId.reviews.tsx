import { createFileRoute } from '@tanstack/react-router'
import { PracticeReviewsPage } from '~/app/pages/PracticeReviewsPage'

export const Route = createFileRoute('/_main/practices_/$practiceId/reviews')({
	component: RouteComponent
})

function RouteComponent() {
	const { practiceId } = Route.useParams()
	return <PracticeReviewsPage practiceId={practiceId} />
}
