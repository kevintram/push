import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/flashcards_/$reviewCardId')({
	beforeLoad: () => {
		throw notFound()
	}
})
