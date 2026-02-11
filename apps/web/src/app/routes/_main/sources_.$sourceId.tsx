import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/sources_/$sourceId')({
	component: RouteComponent
})

function RouteComponent() {
	return <Outlet />
}
