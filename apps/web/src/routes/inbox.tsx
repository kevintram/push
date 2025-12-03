import { createFileRoute } from '@tanstack/react-router'
import { InboxPage } from '~/features/topics'

export const Route = createFileRoute('/inbox')({
	component: RouteComponent
})

function RouteComponent() {
	return <InboxPage />
}
