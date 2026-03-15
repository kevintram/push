import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TopicNavigatorRail } from './TopicNavigator'

const navigateMock = vi.fn()
const useCreateTopicMock = vi.fn()
const useDeleteTopicMock = vi.fn()
const useTopicTreeMock = vi.fn()
const useUpdateTopicMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock,
		Link: ({
			children,
			to,
			params: _params,
			search: _search,
			...props
		}: {
			children?: ReactNode
			to?: string
			params?: unknown
			search?: unknown
		}) => (
			<a data-to={to} href={typeof to === 'string' ? to : '#'} {...props}>
				{children}
			</a>
		)
	}
})

vi.mock('../hooks/useTopicTree', () => ({
	useTopicTree: () => useTopicTreeMock()
}))

vi.mock('../api/createTopic', () => ({
	useCreateTopic: () => useCreateTopicMock()
}))

vi.mock('../api/deleteTopic', () => ({
	useDeleteTopic: () => useDeleteTopicMock()
}))

vi.mock('../api/updateTopic', () => ({
	useUpdateTopic: () => useUpdateTopicMock()
}))

describe('TopicNavigator', () => {
	beforeEach(() => {
		window.localStorage?.removeItem?.('topic-navigator-expanded-ids')
		window.localStorage?.removeItem?.('topic-navigator-width')
		navigateMock.mockReset()
		useCreateTopicMock.mockReset()
		useDeleteTopicMock.mockReset()
		useTopicTreeMock.mockReset()
		useUpdateTopicMock.mockReset()
		useCreateTopicMock.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false
		})
		useDeleteTopicMock.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false
		})
		useUpdateTopicMock.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false
		})
	})

	it('keeps descendants collapsed when there is no active topic', () => {
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 2,
							title: 'Linear equations',
							body: '',
							parent_id: 1,
							parent_title: 'Algebra',
							inserted_at: '',
							updated_at: '',
							children: []
						}
					]
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, [1]]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}]
			]),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={null} className='block' />)

		expect(screen.getByRole('link', { name: 'Algebra' })).toBeInTheDocument()
		expect(screen.queryByText('Move to top level')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('link', { name: 'Linear equations' })
		).not.toBeInTheDocument()
	})

	it('expands the active topic branch', () => {
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 2,
							title: 'Linear equations',
							body: '',
							parent_id: 1,
							parent_title: 'Algebra',
							inserted_at: '',
							updated_at: '',
							children: [
								{
									id: 3,
									title: 'Systems',
									body: '',
									parent_id: 2,
									parent_title: 'Linear equations',
									inserted_at: '',
									updated_at: '',
									children: []
								}
							]
						}
					]
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, [1]],
				[3, [1, 2]]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}],
				[3, {}]
			]),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={2} className='block' />)

		expect(screen.getByRole('link', { name: 'Algebra' })).toBeInTheDocument()
		expect(
			screen.getByRole('link', { name: 'Linear equations' })
		).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('link', { name: 'Systems' })).toBeInTheDocument()
	})

	it('renders guide lines for nested topic branches', () => {
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 2,
							title: 'Linear equations',
							body: '',
							parent_id: 1,
							parent_title: 'Algebra',
							inserted_at: '',
							updated_at: '',
							children: []
						}
					]
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, [1]]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}]
			]),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={2} className='block' />)

		expect(
			screen.getByRole('link', { name: 'Linear equations' }).closest('ul')
		).toHaveClass('border-l')
	})

	it('keeps manually expanded branches open when the active topic changes', () => {
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 2,
							title: 'Linear equations',
							body: '',
							parent_id: 1,
							parent_title: 'Algebra',
							inserted_at: '',
							updated_at: '',
							children: []
						}
					]
				},
				{
					id: 3,
					title: 'Geometry',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 4,
							title: 'Triangles',
							body: '',
							parent_id: 3,
							parent_title: 'Geometry',
							inserted_at: '',
							updated_at: '',
							children: []
						}
					]
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, [1]],
				[3, []],
				[4, [3]]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}],
				[3, {}],
				[4, {}]
			]),
			isLoading: false,
			error: null
		})

		const { rerender } = render(
			<TopicNavigatorRail activeTopicId={2} className='block' />
		)

		fireEvent.click(screen.getByRole('button', { name: 'Expand Geometry' }))
		expect(screen.getByRole('link', { name: 'Triangles' })).toBeInTheDocument()

		rerender(<TopicNavigatorRail activeTopicId={1} className='block' />)

		expect(screen.getByRole('link', { name: 'Triangles' })).toBeInTheDocument()
	})

	it('creates a subtopic from the topic context menu and navigates to it', async () => {
		const createTopicAsync = vi.fn().mockResolvedValue({ id: 7 })
		useCreateTopicMock.mockReturnValue({
			mutateAsync: createTopicAsync,
			isPending: false
		})
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: []
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([[1, []]]),
			nodeById: new Map<number, object>([
				[
					1,
					{
						id: 1,
						title: 'Algebra',
						body: '',
						parent_id: null,
						parent_title: null,
						inserted_at: '',
						updated_at: '',
						children: []
					}
				]
			]),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={1} className='block' />)

		fireEvent.contextMenu(screen.getByRole('link', { name: 'Algebra' }))
		fireEvent.click(await screen.findByRole('menuitem', { name: /New topic/i }))

		await waitFor(() => {
			expect(createTopicAsync).toHaveBeenCalledWith({
				title: '',
				body: '',
				parent_id: 1
			})
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '7' },
			search: { tab: 'subtopics' }
		})
	})

	it('deletes the active topic from the context menu and navigates to its parent', async () => {
		const deleteTopicAsync = vi.fn().mockResolvedValue(undefined)
		useDeleteTopicMock.mockReturnValue({
			mutateAsync: deleteTopicAsync,
			isPending: false
		})
		useTopicTreeMock.mockReturnValue({
			roots: [
				{
					id: 1,
					title: 'Algebra',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
						{
							id: 2,
							title: 'Linear equations',
							body: '',
							parent_id: 1,
							parent_title: 'Algebra',
							inserted_at: '',
							updated_at: '',
							children: []
						}
					]
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, [1]]
			]),
			nodeById: new Map<number, object>([
				[
					1,
					{
						id: 1,
						title: 'Algebra',
						body: '',
						parent_id: null,
						parent_title: null,
						inserted_at: '',
						updated_at: '',
						children: []
					}
				],
				[
					2,
					{
						id: 2,
						title: 'Linear equations',
						body: '',
						parent_id: 1,
						parent_title: 'Algebra',
						inserted_at: '',
						updated_at: '',
						children: []
					}
				]
			]),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={2} className='block' />)

		fireEvent.contextMenu(
			screen.getByRole('link', { name: 'Linear equations' })
		)
		fireEvent.click(await screen.findByRole('menuitem', { name: /^Delete$/i }))
		fireEvent.click(
			await screen.findByRole('button', { name: /Delete topic/i })
		)

		await waitFor(() => {
			expect(deleteTopicAsync).toHaveBeenCalledWith(2)
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' },
			search: { tab: 'subtopics' }
		})
	})
})
