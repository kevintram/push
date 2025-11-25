import { createFileRoute } from '@tanstack/react-router'
import { RecentTopicsPage } from '~/features/topics'

export const Route = createFileRoute('/recent')({
	component: RouteComponent
})

function RouteComponent() {
	return <RecentTopicsPage />
}
