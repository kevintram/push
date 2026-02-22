import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/notes_/$noteId')({
	component: RouteComponent
})

function RouteComponent() {
	return <Outlet />
}
