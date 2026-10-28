import type { Section } from '@convex/validators/sections'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SectionActions } from '../SectionActions'

const convertMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('~/modules/collections/api/sectionQueries', () => ({
	useConvertSectionToCollection: () => ({
		mutate: convertMutate,
		isPending: false,
	}),
	useDeleteSection: () => ({ mutate: deleteMutate, isPending: false }),
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

		expect(convertMutate).toHaveBeenCalledWith({ sectionId: section._id })
	})

	it('deletes only after the confirmation is accepted', async () => {
		const user = userEvent.setup()
		render(<SectionActions section={section} />)

		await user.click(
			screen.getByRole('button', { name: 'Section actions' }),
		)
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(
			screen.getByRole('dialog', { name: 'Delete "Cell anatomy"?' }),
		).toBeInTheDocument()
		expect(deleteMutate).not.toHaveBeenCalled()

		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteMutate).toHaveBeenCalledWith(
			{ sectionId: section._id },
			expect.anything(),
		)
	})
})
