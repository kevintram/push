import type { Section } from '@convex/validators/sections'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SectionActions } from '../SectionActions'

const convertMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('~/modules/collections/api/sectionQueries', () => ({
	useConvertSectionsToCollections: () => ({
		mutate: convertMutate,
		isPending: false,
	}),
}))

vi.mock('~/modules/collections/api/collectionItemQueries', () => ({
	useDeleteCollectionItems: () => ({
		mutate: deleteMutate,
		isPending: false,
	}),
}))

// The dialog has its own tests; this checks only that the menu opens it.
vi.mock('~/modules/collections/components/MoveCollectionItemsDialog', () => ({
	MoveCollectionItemsDialog: ({
		sections,
	}: {
		sections: ReadonlyArray<Section>
	}) => (
		<div
			role='dialog'
			aria-label={`Move ${sections.map(({ _id }) => _id).join()}`}
		/>
	),
}))

const section = {
	_id: 'section-1' as Section['_id'],
	title: 'Cell anatomy',
} as Section

describe('SectionActions', () => {
	it('converts the section to a subcollection without confirming', async () => {
		const user = userEvent.setup()
		render(<SectionActions section={section} />)

		await user.click(
			screen.getByRole('button', { name: 'Section actions' }),
		)
		await user.click(
			screen.getByRole('menuitem', { name: 'Convert to subcollection' }),
		)

		expect(convertMutate).toHaveBeenCalledWith({ sections: [section] })
	})

	it('opens the move dialog for the section', async () => {
		const user = userEvent.setup()
		render(<SectionActions section={section} />)

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

		await user.click(
			screen.getByRole('button', { name: 'Section actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Move' }))

		expect(
			screen.getByRole('dialog', { name: 'Move section-1' }),
		).toBeInTheDocument()
	})

	it('deletes only after the confirmation is accepted', async () => {
		const user = userEvent.setup()
		render(<SectionActions section={section} />)

		await user.click(
			screen.getByRole('button', { name: 'Section actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(
			screen.getByRole('dialog', { name: 'Delete “Cell anatomy”?' }),
		).toBeInTheDocument()
		expect(deleteMutate).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ sectionIds: [section._id], cardIds: [] },
			expect.anything(),
		)
	})
})
