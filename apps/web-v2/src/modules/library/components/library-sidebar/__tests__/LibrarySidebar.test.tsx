import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LibrarySidebar } from '../LibrarySidebar'

const navigate = vi.fn()
const createTopic = vi.fn()
const deleteTopic = vi.fn()
let currentTopicId: string | undefined = '2'

vi.mock('@tanstack/react-query', () => ({
	queryOptions: <T,>(options: T) => options,
	useQuery: () => ({
		data: [
			{
				id: 1,
				title: 'Parent',
				body: '',
				children: [
					{
						id: 2,
						parentId: 1,
						title: '',
						body: '',
						children: [],
					},
				],
			},
			{
				id: 4,
				title: 'Unrelated',
				body: '',
				children: [],
			},
		],
	}),
}))
vi.mock('@tanstack/react-router', () => ({
	Link: ({
		children,
		params,
		to: _to,
		...props
	}: Omit<ComponentProps<'a'>, 'href'> & {
		children?: ReactNode
		params: { topicId: string }
		to: string
	}) => (
		<a href={`/library/${params.topicId}`} {...props}>
			{children}
		</a>
	),
	useNavigate: () => navigate,
	useParams: () => ({ topicId: currentTopicId }),
}))
vi.mock('../../../api/createTopic', () => ({
	useCreateTopic: () => ({
		isPending: false,
		mutateAsync: createTopic,
	}),
}))
vi.mock('../../../api/deleteTopic', () => ({
	useDeleteTopic: () => ({
		isPending: false,
		mutateAsync: deleteTopic,
	}),
}))

describe('LibrarySidebar', () => {
	beforeEach(() => {
		currentTopicId = '2'
		navigate.mockReset().mockResolvedValue(undefined)
		createTopic.mockReset().mockResolvedValue({
			id: 3,
			parentId: 2,
			title: '',
			body: '',
		})
		deleteTopic.mockReset().mockResolvedValue(undefined)
	})

	it('creates a subtopic from the right-clicked topic', async () => {
		const user = userEvent.setup()
		render(<LibrarySidebar />)

		const childLink = screen.getByRole('link', { name: 'Untitled' })
		expect(childLink).toHaveAttribute('href', '/library/2')

		fireEvent.contextMenu(childLink)
		await user.click(screen.getByRole('menuitem', { name: 'Add subtopic' }))

		expect(createTopic).toHaveBeenCalledWith({ parentId: 2 })
		expect(navigate).toHaveBeenCalledOnce()
		expect(navigate.mock.calls[0]?.[0]).toMatchObject({
			to: '/library/$topicId',
			params: { topicId: '3' },
		})
	})

	it('confirms deletion and leaves a deleted subtree safely', async () => {
		const user = userEvent.setup()
		render(<LibrarySidebar />)

		fireEvent.contextMenu(screen.getByRole('link', { name: 'Parent' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

		expect(deleteTopic).not.toHaveBeenCalled()
		expect(
			screen.getByRole('heading', { name: 'Delete “Parent”?' }),
		).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteTopic).toHaveBeenCalledWith(1)
		expect(navigate).toHaveBeenCalledWith({ to: '/library' })
	})

	it('keeps the current page when deleting an unrelated topic', async () => {
		const user = userEvent.setup()
		render(<LibrarySidebar />)

		fireEvent.contextMenu(screen.getByRole('link', { name: 'Unrelated' }))
		await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
		await user.click(screen.getByRole('button', { name: 'Delete' }))

		expect(deleteTopic).toHaveBeenCalledWith(4)
		expect(navigate).not.toHaveBeenCalled()
	})
})
