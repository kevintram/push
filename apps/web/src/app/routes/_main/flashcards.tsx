import { createFileRoute } from '@tanstack/react-router'
import { FlashcardsPage } from '~/app/pages/FlashcardsPage'

export const Route = createFileRoute('/_main/flashcards')({
	component: FlashcardsPage
})
