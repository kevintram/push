import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MouseEvent, ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { LibraryOutline } from '../LibraryOutline'

const navigateMock = vi.fn()
const handleConfirmDeleteTopicMock = vi.fn()
const handleCreateSubtopicMock = vi.fn()
const handleDialogOpenChangeMock = vi.fn()
const setPendingDeleteTopicIdMock = vi.fn()

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		Link: ({
			children,
			to,
			hash,
			onClick,
			hashScrollIntoView: _hashScrollIntoView,
			resetScroll: _resetScroll,
			search: _search,
			...props
		}: {
			children?: ReactNode
			to?: string
			hash?: string
			onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
			hashScrollIntoView?: unknown
			resetScroll?: unknown
			search?: unknown
		}) => (
			<a
				data-hash={hash}
				data-to={to}
				href={`${to ?? ''}${hash ? `#${hash}` : ''}`}
				onClick={onClick}
				{...props}
			>
				{children}
			</a>
		),
		useNavigate: () => navigateMock
	}
})

vi.mock('~/app/pages/topic-detail/useTopicDetailOutline', () => ({
	useTopicDetailOutline: () => ({
		collapseAll: vi.fn(),
		expandedIdSet: new Set<number>(),
		handleConfirmDeleteTopic: handleConfirmDeleteTopicMock,
		handleCreateSubtopic: handleCreateSubtopicMock,
		handleDialogOpenChange: handleDialogOpenChangeMock,
		isDeletingTopic: false,
		isUpdatingTopic: false,
		pendingDeleteTopic: null,
		pendingDeleteTopicId: null,
		setPendingDeleteTopicId: setPendingDeleteTopicIdMock,
		suppressSelectionRef: { current: false },
		toggleExpanded: vi.fn()
	})
}))

vi.mock('~/app/pages/topic-detail/useTopicDetailOutlineSizing', () => ({
	useTopicDetailOutlineSizing: () => ({
		asideStyle: {},
		footerRef: vi.fn(),
		handleResizeKeyDown: vi.fn(),
		handleResizeStart: vi.fn(),
		outlineHeaderRef: vi.fn(),
		outlineListStyle: {},
		outlineNavRef: vi.fn(),
		outlineRef: vi.fn(),
		registerOutlineItemRef: vi.fn(),
		resizeButtonRef: vi.fn()
	})
}))

vi.mock('~/features/topics/components/topic-tree/TopicTreeItem', () => ({
	TopicTreeItem: ({
		node,
		renderPrimaryAction,
		suppressSelectionRef
	}: {
		node: { id: number; title: string; body: string }
		renderPrimaryAction: (props: {
			className: string
			label: string
			node: { id: number; title: string; body: string }
			suppressSelectionRef: { current: boolean }
		}) => ReactNode
		suppressSelectionRef: { current: boolean }
	}) => (
		<li data-testid={`topic-tree-item-${node.id}`}>
			{renderPrimaryAction({
				className: 'outline-link',
				label: node.title,
				node,
				suppressSelectionRef
			})}
		</li>
	)
}))

describe('LibraryOutline', () => {
	it('renders a static Library root row and links child topics to the library route hashes', async () => {
		const user = userEvent.setup()
		const onSectionSelect = vi.fn()

		render(
			<LibraryOutline
				ancestorIdsById={new Map([[1, []]])}
				freshTopicId={null}
				globalFilter='all'
				libraryRootNode={{
					id: 0,
					title: 'Library',
					body: '',
					parent_id: null,
					parent_title: null,
					inserted_at: '',
					updated_at: '',
					children: [
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
				}}
				nodeById={
					new Map([
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
					])
				}
				onCreateRootTopic={vi.fn()}
				onGlobalFilterChange={vi.fn()}
				onOutlineWidthChange={vi.fn()}
				onSectionSelect={onSectionSelect}
				onSubtopicCreated={vi.fn()}
				outlineWidth={320}
				pendingCreatedParentTopicId={null}
				pendingCreatedTopicId={null}
				sectionNumberById={new Map([[1, '1']])}
				visibleSectionIds={[0]}
			/>
		)

		expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
			'href',
			'/topics#topic-0'
		)
		expect(screen.getByRole('link', { name: '1 Algebra' })).toHaveAttribute(
			'href',
			'/topics#topic-1'
		)

		await user.click(screen.getByRole('link', { name: 'Library' }))

		expect(onSectionSelect).toHaveBeenCalledWith(0)
	})
})
