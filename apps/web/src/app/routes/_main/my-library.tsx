import { createFileRoute } from '@tanstack/react-router'
import { MyLibraryPage } from '~/app/pages/MyLibraryPage'

export const Route = createFileRoute('/_main/my-library')({
	component: MyLibraryPage
})
