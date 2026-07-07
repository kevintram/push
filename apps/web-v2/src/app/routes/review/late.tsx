import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/review/late')({
	component: RouteComponent,
})

function RouteComponent() {
	return <h2>Late</h2>
}
