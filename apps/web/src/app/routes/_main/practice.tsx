import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practice')({
	beforeLoad: () => {
		throw redirect({
			to: '/review',
			search: { filter: 'practice' }
		})
	}
})
