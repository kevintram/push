import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TopicDetailBreadcrumb } from '../TopicDetailBreadcrumb'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		Link: ({
			children,
			params,
			to,
			...props
		}: {
			children?: ReactNode
			params?: { topicId?: string }
			to?: string
		}) => {
			const href =
				to === '/topics/$topicId'
					? `/topics/${params?.topicId ?? ''}`
					: (to ?? '')

			return (
				<a href={href} {...props}>
					{children}
				</a>
			)
		},
		useNavigate: () => navigateMock
	}
})

vi.mock('~/hooks/useResizeObserver', () => ({
	useElementSize: () => ({
		ref: vi.fn(),
		width: 560
	})
}))

describe('TopicDetailBreadcrumb', () => {
	it('prepends a Library link before a top-level topic', () => {
		render(
			<TopicDetailBreadcrumb
				currentTopicId={1}
				topicPath={[
					{
						id: 1,
						title: 'Algebra',
						body: ''
					}
				]}
			/>
		)

		expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
			'href',
			'/topics'
		)
		expect(screen.getByText('Algebra')).toBeInTheDocument()
	})
})
