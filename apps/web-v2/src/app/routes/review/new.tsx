import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/review/new')({
	component: RouteComponent,
})

function RouteComponent() {
	return <h2>New</h2>
}
