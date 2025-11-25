import { createFileRoute } from '@tanstack/react-router'
import { ArchivedTopicsPage } from '~/features/topics'

export const Route = createFileRoute('/archived')({
	component: RouteComponent
})

function RouteComponent() {
	return <ArchivedTopicsPage />
}
