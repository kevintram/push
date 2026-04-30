import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/flashcards')({
	beforeLoad: () => {
		throw redirect({
			to: '/due',
			search: { filter: 'flashcards' }
		})
	}
})
