import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/topics')({
	beforeLoad: () => {
		throw redirect({ to: '/review' })
	}
})
