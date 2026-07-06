import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/review/completed')({
	component: RouteComponent,
})

function RouteComponent() {
	return <h2>Completed</h2>
}
