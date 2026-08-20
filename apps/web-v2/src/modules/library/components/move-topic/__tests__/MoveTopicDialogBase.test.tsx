import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Topic } from '~/modules/library/types/topic.types'

import { MoveTopicDialogBase } from '../MoveTopicDialogBase'

const topics = [
	{
		_id: 'topic-1' as Id<'topics'>,
		_creationTime: 0,
		description: '',
		ownerId: 'user-1',
		searchText: 'Languages',
		title: 'Languages',
	},
	{
		_id: 'topic-2' as Id<'topics'>,
		_creationTime: 1,
		description: '',
		ownerId: 'user-1',
		parentId: 'topic-1' as Id<'topics'>,
		searchText: 'Spanish',
		title: 'Spanish',
	},
	{
		_id: 'topic-3' as Id<'topics'>,
		_creationTime: 2,
		description: '',
		ownerId: 'user-1',
		searchText: 'Science',
		title: 'Science',
	},
] as const satisfies ReadonlyArray<Topic>

const TOPIC_LIST_KEY = ['convex', 'topics', 'list']

type QueryState = {
	data: ReadonlyArray<Topic> | undefined
	isError: boolean
	isPending: boolean
}

let queryState: QueryState

type TopicOnlyDialogProps = Extract<
	React.ComponentProps<typeof MoveTopicDialogBase>,
	{ allowLibraryRoot?: false }
>

vi.mock('~/modules/library/api/topicQueries', () => ({
	topicQueries: {
		list: () => ({ queryKey: TOPIC_LIST_KEY, queryFn: () => topics }),
	},
}))

vi.mock('@tanstack/react-query', async importOriginal => {
	const actual =
		await importOriginal<typeof import('@tanstack/react-query')>()
	return {
		...actual,
		useQuery: () => queryState,
	}
})

function renderDialog(overrides: Partial<TopicOnlyDialogProps> = {}) {
	const defaults = {
		initialDestination: 'topic-1' as Id<'topics'>,
		isPending: false,
		onMove: vi.fn(),
		onOpenChange: vi.fn(),
		title: 'Move item',
	} satisfies TopicOnlyDialogProps

	const props = { ...defaults, ...overrides }
	render(<MoveTopicDialogBase {...props} />)
	return props
}

describe('MoveTopicDialogBase', () => {
	beforeEach(() => {
		queryState = { data: [...topics], isError: false, isPending: false }
	})

	it('renders loading state', () => {
		queryState = { data: undefined, isError: false, isPending: true }
		renderDialog()

		expect(screen.getByText('Loading topics…')).toBeInTheDocument()
	})

	it('renders error state', () => {
		queryState = { data: undefined, isError: true, isPending: false }
		renderDialog()

		expect(screen.getByText('Could not load topics.')).toBeInTheDocument()
	})

	it('renders empty state', () => {
		queryState = { data: [], isError: false, isPending: false }
		renderDialog()

		expect(screen.getByText('No topics available.')).toBeInTheDocument()
	})

	it('disables Move when destination has not changed', () => {
		renderDialog({ initialDestination: 'topic-1' as Id<'topics'> })

		expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled()
	})

	it('enables Move when a different destination is selected', async () => {
		renderDialog({ initialDestination: 'topic-1' as Id<'topics'> })

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: 'Spanish' }))

		expect(screen.getByRole('button', { name: 'Move' })).toBeEnabled()
	})

	it('calls onMove with the selected destination', async () => {
		const { onMove } = renderDialog({
			initialDestination: 'topic-1' as Id<'topics'>,
		})
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Science' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith('topic-3')
	})

	it('disables controls while pending', () => {
		renderDialog({ isPending: true })

		expect(screen.getByRole('button', { name: 'Moving…' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
	})

	it('prevents dismissal while pending', () => {
		const { onOpenChange } = renderDialog({ isPending: true })

		const dialog = screen.getByRole('dialog')
		expect(dialog).toBeInTheDocument()

		// attempt to close via the close button
		const closeButton = screen.getByRole('button', { name: 'Close' })
		closeButton.click()

		expect(onOpenChange).not.toHaveBeenCalled()
	})

	it('renders a description when provided', () => {
		renderDialog({ description: 'Items will move together.' })

		expect(
			screen.getByText('Items will move together.'),
		).toBeInTheDocument()
	})

	it('calls onMove with null when Library root is selected', async () => {
		const onMove = vi.fn()
		render(
			<MoveTopicDialogBase
				allowLibraryRoot
				initialDestination={'topic-1' as Id<'topics'>}
				isPending={false}
				onMove={onMove}
				onOpenChange={vi.fn()}
				title='Move item'
			/>,
		)
		const user = userEvent.setup()

		await user.click(screen.getByRole('button', { name: 'Library' }))
		await user.click(screen.getByRole('button', { name: 'Move' }))

		expect(onMove).toHaveBeenCalledWith(null)
	})
})
