import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practices_/$practiceId')({
	component: RouteComponent
})

function RouteComponent() {
	return <Outlet />
}
