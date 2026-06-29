import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/practice_/$reviewCardId')({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: '/review-cards/$reviewCardId',
			params: { reviewCardId: params.reviewCardId },
			search: { tab: 'home' },
		})
	},
})
