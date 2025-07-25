import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/logbook')({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello "/logbook"!</div>
}
