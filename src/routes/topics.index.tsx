import { createFileRoute } from '@tanstack/react-router'
import { RootTopicsPage } from '~/features/topic-hub/components/RootTopicsPage'

export const Route = createFileRoute('/topics/')({
	component: RouteComponent
})

function RouteComponent() {
	return <RootTopicsPage />
}
