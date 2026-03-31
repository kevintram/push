import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TopicNavigatorRail } from '../TopicNavigator'

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
			preload: _preload,
			preloadDelay: _preloadDelay,
			search: _search,
			...props
		}: {
			children?: ReactNode
			to?: string
			params?: unknown
			preload?: unknown
			preloadDelay?: unknown
			search?: unknown
		}) => (
			<a data-to={to} href={typeof to === 'string' ? to : '#'} {...props}>
				{children}
			</a>
		)
	}
})

vi.mock('~/features/topics/hooks/useTopicTree', () => ({
	useTopicTree: () => useTopicTreeMock()
}))

vi.mock('~/features/topics/api/createTopic', () => ({
	useCreateTopic: () => useCreateTopicMock()
}))

vi.mock('~/features/topics/api/deleteTopic', () => ({
	useDeleteTopic: () => useDeleteTopicMock()
}))

vi.mock('~/features/topics/api/updateTopic', () => ({
	useUpdateTopic: () => useUpdateTopicMock()
}))

function mockElementRect(
	element: Element,
	{
		top,
		height,
		left = 0,
		width = 240
	}: {
		top: number
		height: number
		left?: number
		width?: number
	}
) {
	Object.defineProperty(element, 'getBoundingClientRect', {
		configurable: true,
		value: () => ({
			top,
			bottom: top + height,
			left,
			right: left + width,
			width,
			height,
			x: left,
			y: top,
			toJSON: () => ({})
		})
	})
}

describe('TopicNavigator', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	beforeEach(() => {
		window.localStorage?.removeItem?.('topic-navigator-expanded-ids')
		window.localStorage?.removeItem?.('topic-navigator-width')
		window.sessionStorage.clear()
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

	it('highlights the active topic subtree', () => {
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

		const activeWrapper = screen
			.getByRole('link', { name: 'Linear equations' })
			.closest('li')?.firstElementChild
		const inactiveWrapper = screen
			.getByRole('link', { name: 'Algebra' })
			.closest('li')?.firstElementChild

		expect(activeWrapper).toHaveClass('bg-[var(--app-chrome-selected)]')
		expect(activeWrapper).not.toHaveClass('ring-1')
		expect(inactiveWrapper).not.toHaveClass('bg-[var(--app-chrome-selected)]')
		expect(screen.getByRole('link', { name: 'Systems' })).toBeInTheDocument()
	})

	it('highlights the hovered topic subtree', () => {
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

		render(<TopicNavigatorRail activeTopicId={null} className='block' />)

		fireEvent.click(screen.getByRole('button', { name: 'Expand Algebra' }))

		const hoveredLink = screen.getByRole('link', { name: 'Algebra' })
		const hoveredTrigger = hoveredLink.closest(
			'[data-slot="context-menu-trigger"]'
		)
		const hoveredWrapper = hoveredLink.closest('li')?.firstElementChild
		const descendantWrapper = screen
			.getByRole('link', { name: 'Linear equations' })
			.closest('li')?.firstElementChild

		if (!hoveredTrigger) throw new Error('hover trigger not found')

		fireEvent.pointerEnter(hoveredTrigger)

		expect(hoveredWrapper).toHaveClass('bg-[var(--app-chrome-hover)]')
		expect(hoveredWrapper).not.toHaveClass('ring-1')
		expect(descendantWrapper).not.toHaveClass('bg-[var(--app-chrome-hover)]')

		fireEvent.pointerLeave(hoveredTrigger)

		expect(hoveredWrapper).not.toHaveClass('bg-[var(--app-chrome-hover)]')
	})

	it('keeps an active descendant selected while a hovered ancestor uses hover styling', () => {
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

		const ancestorLink = screen.getByRole('link', { name: 'Algebra' })
		const ancestorTrigger = ancestorLink.closest(
			'[data-slot="context-menu-trigger"]'
		)
		const ancestorWrapper = ancestorLink.closest('li')?.firstElementChild
		const activeWrapper = screen
			.getByRole('link', { name: 'Linear equations' })
			.closest('li')?.firstElementChild

		if (!ancestorTrigger) throw new Error('ancestor hover trigger not found')

		fireEvent.pointerEnter(ancestorTrigger)

		expect(ancestorWrapper).toHaveClass('bg-[var(--app-chrome-hover)]')
		expect(activeWrapper).toHaveClass('bg-[var(--app-chrome-selected)]')
		expect(activeWrapper).not.toHaveClass('bg-[var(--app-chrome-hover)]')
	})

	it('keeps an active ancestor selected while a hovered descendant uses hover styling', () => {
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

		render(<TopicNavigatorRail activeTopicId={1} className='block' />)

		const descendantLink = screen.getByRole('link', {
			name: 'Linear equations'
		})
		const descendantTrigger = descendantLink.closest(
			'[data-slot="context-menu-trigger"]'
		)
		const descendantWrapper = descendantLink.closest('li')?.firstElementChild
		const activeWrapper = screen
			.getByRole('link', { name: 'Algebra' })
			.closest('li')?.firstElementChild

		if (!descendantTrigger) {
			throw new Error('descendant hover trigger not found')
		}

		fireEvent.pointerEnter(descendantTrigger)

		expect(activeWrapper).toHaveClass('bg-[var(--app-chrome-selected)]')
		expect(descendantWrapper).toHaveClass('bg-[var(--app-chrome-hover)]')
		expect(descendantWrapper).not.toHaveClass('bg-[var(--app-chrome-selected)]')
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
		fireEvent.click(
			await screen.findByRole('menuitem', { name: /New topic/iu })
		)

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
			search: { focusTitle: true }
		})
	})

	it('opens a topic from the topic context menu', async () => {
		navigateMock.mockResolvedValue(undefined)
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
		fireEvent.click(await screen.findByRole('menuitem', { name: /^Open$/iu }))

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: '/topics/$topicId',
				params: { topicId: '1' }
			})
		})
	})

	it('creates a root topic from the navigator button and records title focus intent', async () => {
		const createTopicAsync = vi.fn().mockResolvedValue({ id: 8 })
		useCreateTopicMock.mockReturnValue({
			mutateAsync: createTopicAsync,
			isPending: false
		})
		useTopicTreeMock.mockReturnValue({
			roots: [],
			ancestorIdsById: new Map<number, Array<number>>(),
			nodeById: new Map<number, object>(),
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail className='block' />)

		fireEvent.click(screen.getByRole('button', { name: 'Create new topic' }))

		await waitFor(() => {
			expect(createTopicAsync).toHaveBeenCalledWith({
				title: '',
				body: ''
			})
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '8' },
			search: { focusTitle: true }
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
		fireEvent.click(await screen.findByRole('menuitem', { name: /^Delete$/iu }))
		fireEvent.click(
			await screen.findByRole('button', { name: /Delete topic/iu })
		)

		await waitFor(() => {
			expect(deleteTopicAsync).toHaveBeenCalledWith(2)
		})
		expect(navigateMock).toHaveBeenCalledWith({
			to: '/topics/$topicId',
			params: { topicId: '1' }
		})
	})

	it('smoothly centers the active topic in the rail when it is offscreen', async () => {
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
			callback(0)
			return 1
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
				},
				{
					id: 2,
					title: 'Geometry',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: []
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, []]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}]
			]),
			isLoading: false,
			error: null
		})

		const { container, rerender } = render(
			<TopicNavigatorRail activeTopicId={1} className='block' />
		)

		const scrollContainer = container.querySelector(
			'[data-slot="scroll-area-viewport"]'
		)
		if (!scrollContainer) throw new Error('scroll container not found')

		Object.defineProperty(scrollContainer, 'clientHeight', {
			configurable: true,
			value: 200
		})
		Object.defineProperty(scrollContainer, 'scrollHeight', {
			configurable: true,
			value: 1000
		})
		;(scrollContainer as HTMLElement).scrollTop = 80
		const scrollToMock = vi.fn()
		;(scrollContainer as HTMLElement).scrollTo = scrollToMock

		mockElementRect(scrollContainer, { top: 100, height: 200 })

		const activeItem = screen
			.getByRole('link', { name: 'Geometry' })
			.closest('li')
		if (!activeItem) throw new Error('active item not found')
		mockElementRect(activeItem, { top: 360, height: 40 })

		rerender(<TopicNavigatorRail activeTopicId={2} className='block' />)

		await waitFor(() => {
			expect(scrollToMock).toHaveBeenCalledWith({
				top: 260,
				behavior: 'smooth'
			})
		})
	})

	it('does not scroll the rail when the active topic is already visible', async () => {
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
			callback(0)
			return 1
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
				},
				{
					id: 2,
					title: 'Geometry',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: []
				}
			],
			ancestorIdsById: new Map<number, Array<number>>([
				[1, []],
				[2, []]
			]),
			nodeById: new Map<number, object>([
				[1, {}],
				[2, {}]
			]),
			isLoading: false,
			error: null
		})

		const { container, rerender } = render(
			<TopicNavigatorRail activeTopicId={1} className='block' />
		)

		const scrollContainer = container.querySelector(
			'[data-slot="scroll-area-viewport"]'
		)
		if (!scrollContainer) throw new Error('scroll container not found')

		Object.defineProperty(scrollContainer, 'clientHeight', {
			configurable: true,
			value: 200
		})
		Object.defineProperty(scrollContainer, 'scrollHeight', {
			configurable: true,
			value: 1000
		})
		;(scrollContainer as HTMLElement).scrollTop = 80
		const scrollToMock = vi.fn()
		;(scrollContainer as HTMLElement).scrollTo = scrollToMock

		mockElementRect(scrollContainer, { top: 100, height: 200 })

		const activeItem = screen
			.getByRole('link', { name: 'Geometry' })
			.closest('li')
		if (!activeItem) throw new Error('active item not found')
		mockElementRect(activeItem, { top: 180, height: 40 })

		rerender(<TopicNavigatorRail activeTopicId={2} className='block' />)

		await waitFor(() => {
			expect(scrollToMock).not.toHaveBeenCalled()
		})
	})
})
