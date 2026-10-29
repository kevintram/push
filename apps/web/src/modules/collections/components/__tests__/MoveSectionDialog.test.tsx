import type { Id } from '@convex/_generated/dataModel'
import type { Section } from '@convex/validators/sections'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Collection } from '~/modules/collections/types/collection.types'

import { MoveSectionDialog } from '../MoveSectionDialog'

const moveMutate = vi.fn()

const collections: ReadonlyArray<Collection> = [
	{
		_id: 'collection-1' as Id<'collections'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Biology',
		title: 'Biology',
	},
	{
		_id: 'collection-2' as Id<'collections'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		path: [],
		searchText: 'Chemistry',
		title: 'Chemistry',
	},
]

vi.mock('~/modules/collections/api/collectionQueries', () => ({
	collectionQueries: {
		list: () => ({
			queryKey: ['convex', 'collections', 'list'],
			queryFn: () => collections,
		}),
	},
}))

vi.mock('~/modules/collections/api/sectionQueries', () => ({
	useMoveSectionToCollection: () => ({
		mutate: moveMutate,
		isPending: false,
	}),
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: () => ({
			data: [...collections],
			isError: false,
			isPending: false,
		}),
	}
})

const section = {
	_id: 'section-1' as Section['_id'],
	collectionId: 'collection-1' as Id<'collections'>,
	title: 'Cell anatomy',
} as Section

describe('MoveSectionDialog', () => {
	it('moves the section to the picked collection and closes on success', async () => {
		const user = userEvent.setup()
		const onOpenChange = vi.fn()

		render(
			<MoveSectionDialog onOpenChange={onOpenChange} section={section} />,
		)

		await user.click(screen.getByRole('button', { name: 'Chemistry' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		const [args, options] = moveMutate.mock.calls.at(-1) as [
			unknown,
			{ onSuccess: () => void },
		]
		expect(args).toEqual({
			sectionId: 'section-1',
			collectionId: 'collection-2',
		})
		expect(onOpenChange).not.toHaveBeenCalled()

		act(() => options.onSuccess())

		expect(onOpenChange).toHaveBeenCalledWith(false)
	})
})
