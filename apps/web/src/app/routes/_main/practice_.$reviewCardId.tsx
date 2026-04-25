import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practice_/$reviewCardId')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: params.reviewCardId },
			search: { tab: 'home' }
		})
	}
})
