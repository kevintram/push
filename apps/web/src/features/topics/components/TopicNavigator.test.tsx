import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TopicNavigatorRail } from './TopicNavigator'

const useTopicTreeMock = vi.fn()

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

describe('TopicNavigator', () => {
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
			isLoading: false,
			error: null
		})

		render(<TopicNavigatorRail activeTopicId={null} className='block' />)

		expect(screen.getByRole('link', { name: 'Algebra' })).toBeInTheDocument()
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
})
