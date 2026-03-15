import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TopicNavigatorRail } from './TopicNavigator'

const useTopicTreeMock = vi.fn()
const useUpdateTopicMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
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

vi.mock('../api/updateTopic', () => ({
	useUpdateTopic: () => useUpdateTopicMock()
}))

describe('TopicNavigator', () => {
	beforeEach(() => {
		window.localStorage?.removeItem?.('topic-navigator-expanded-ids')
		window.localStorage?.removeItem?.('topic-navigator-width')
		useTopicTreeMock.mockReset()
		useUpdateTopicMock.mockReset()
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
})
