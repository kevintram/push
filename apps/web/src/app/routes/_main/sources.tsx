import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/sources')({
	beforeLoad: () => {
		throw redirect({ to: '/home' })
	}
})
