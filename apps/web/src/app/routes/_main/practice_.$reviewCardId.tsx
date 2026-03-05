import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/practice_/$reviewCardId')({
	beforeLoad: () => {
		throw notFound()
	}
})
