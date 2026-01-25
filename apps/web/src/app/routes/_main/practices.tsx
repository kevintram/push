import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practices')({
	beforeLoad: () => {
		throw redirect({ to: '/home' })
	}
})
