import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/topics_/$topicId')({
	component: RouteComponent
})

function RouteComponent() {
	return <Outlet />
}
