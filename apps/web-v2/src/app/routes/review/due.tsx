import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/review/due')({
	component: RouteComponent,
})

function RouteComponent() {
	return <h2>Due</h2>
}
