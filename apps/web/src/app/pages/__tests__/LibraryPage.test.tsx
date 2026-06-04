import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LibraryPage } from '../LibraryPage'

const navigateMock = vi.fn()
const createTopicAsyncMock = vi.fn()
const useTopicTreeMock = vi.fn()
const useReviewCardsMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		useNavigate: () => navigateMock
	}
})

vi.mock('~/app/hooks/useSectionCollapse', () => ({
	useSectionCollapse: () => ({
		collapsedSections: {},
		expandSection: vi.fn(),
		toggleSection: vi.fn()
	})
}))

vi.mock('~/app/pages/library/LibraryOutline', () => ({
	LibraryOutline: ({
		libraryRootNode
	}: {
		libraryRootNode: { title: string }
	}) => <div data-testid='library-outline'>{libraryRootNode.title}</div>
}))

vi.mock('~/app/pages/topic-detail/TopicDetailSection', () => ({
	TopicDetailSection: ({
		section
	}: {
		section: { topic: { title: string } }
	}) => (
		<section data-testid='topic-detail-section'>{section.topic.title}</section>
	)
}))

vi.mock('~/app/pages/topic-detail/useTopicDetailNavigation', () => ({
	useTopicDetailNavigation: () => ({
		preserveSectionOffset: vi.fn(),
		registerSectionHeadingRef: vi.fn(),
		registerSectionRef: vi.fn(),
		scrollToSection: vi.fn(),
		visibleSectionIds: [0]
	})
}))

vi.mock('~/modules/topics/hooks/useTopicTree', () => ({
	useTopicTree: (...args: Array<unknown>) => useTopicTreeMock(...args)
}))

vi.mock('~/modules/review-cards/api/getReviewCards', () => ({
	useReviewCards: (...args: Array<unknown>) => useReviewCardsMock(...args)
}))

vi.mock('~/modules/topics/api/createTopic', () => ({
	useCreateTopic: () => ({
		mutateAsync: createTopicAsyncMock,
		isPending: false
	})
}))

const childTopic = {
	id: 2,
	title: 'Linear equations',
	body: '',
	parent_id: 1,
	parent_title: 'Algebra',
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z',
	children: []
}

const rootTopic = {
	id: 1,
	title: 'Algebra',
	body: 'Working with expressions',
	parent_id: null,
	parent_title: null,
	inserted_at: '2026-03-01T12:00:00.000Z',
	updated_at: '2026-03-04T12:00:00.000Z',
	children: [childTopic]
}

describe('LibraryPage', () => {
	it('renders the library shell with top-level topic sections', () => {
		useTopicTreeMock.mockReturnValue({
			ancestorIdsById: new Map([
				[rootTopic.id, []],
				[childTopic.id, [rootTopic.id]]
			]),
			data: [rootTopic, childTopic],
			error: null,
			isLoading: false,
			nodeById: new Map<number, typeof rootTopic | typeof childTopic>([
				[rootTopic.id, rootTopic],
				[childTopic.id, childTopic]
			]),
			roots: [rootTopic]
		})
		useReviewCardsMock.mockReturnValue({
			data: [],
			error: null,
			isLoading: false
		})

		render(<LibraryPage />)

		expect(screen.getByText('Library', { selector: 'h1' })).toBeInTheDocument()
		expect(screen.getByTestId('library-outline')).toHaveTextContent('Library')
		expect(screen.getByTestId('topic-detail-section')).toHaveTextContent(
			'Algebra'
		)
		expect(screen.queryByTestId('masonry-layout')).not.toBeInTheDocument()
	})

	it('creates a blank root topic from the library shell without opening topic detail', async () => {
		const user = userEvent.setup()
		useTopicTreeMock.mockReturnValue({
			ancestorIdsById: new Map(),
			data: [],
			error: null,
			isLoading: false,
			nodeById: new Map(),
			roots: []
		})
		useReviewCardsMock.mockReturnValue({
			data: [],
			error: null,
			isLoading: false
		})
		createTopicAsyncMock.mockResolvedValue({
			id: 42
		})

		render(<LibraryPage />)

		await user.click(screen.getByRole('button', { name: 'New topic' }))

		expect(createTopicAsyncMock).toHaveBeenCalledWith({
			title: '',
			body: '',
			parent_id: null
		})
		expect(navigateMock).not.toHaveBeenCalledWith(
			expect.objectContaining({
				to: '/topics/$topicId'
			})
		)
	})
})
