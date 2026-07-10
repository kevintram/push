import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TopicDetailHeader } from '../TopicDetailHeader'

vi.mock('~/components/ui/textarea', () => ({
	Textarea: ({ value }: { value: string }) => (
		<textarea readOnly={true} value={value} />
	),
}))

vi.mock('~/modules/topics/api/updateTopic', () => ({
	useUpdateTopic: () => ({
		mutateAsync: vi.fn(),
	}),
}))

vi.mock('~/hooks/useAutoSave', () => ({
	useAutoSave: ({ initialValue }: { initialValue: string }) => ({
		value: initialValue,
		onChange: vi.fn(),
		flush: vi.fn(),
	}),
}))

vi.mock('~/utils/formatRelativeDate', () => ({
	formatAbsoluteDate: () => 'Apr 24, 2026',
	formatRelativeDate: () => ({ text: 'today' }),
}))

vi.mock('../TopicDetailBreadcrumb', () => ({
	TopicDetailBreadcrumb: () => (
		<div data-testid='topic-detail-breadcrumb'>Library breadcrumb</div>
	),
}))

vi.mock('../TopicDetailRootActionsMenu', () => ({
	TopicDetailRootActionsMenu: () => <div data-testid='topic-actions-menu' />,
}))

vi.mock('../TopicDetailSectionMeta', () => ({
	TopicDetailSectionMeta: () => <div data-testid='topic-section-meta' />,
}))

vi.mock('../topicDetailTheme', () => ({
	getTopicDetailRootPresentation: () => ({
		rootTitleClassName: 'root-title',
	}),
}))

describe('TopicDetailHeader', () => {
	it('shows breadcrumbs for a top-level topic', () => {
		render(
			<TopicDetailHeader
				headingLevel={1}
				isCreatingTopic={false}
				onCreateSubtopic={vi.fn()}
				onOpenDeleteDialog={vi.fn()}
				topic={{
					id: 1,
					title: 'Algebra',
					body: '',
					parentId: null,
					parentTitle: null,
					insertedAt: '2026-04-24T12:00:00.000Z',
					updatedAt: '2026-04-24T12:00:00.000Z',
				}}
				topicPath={[
					{
						id: 1,
						title: 'Algebra',
						body: '',
					},
				]}
			/>,
		)

		expect(
			screen.getByTestId('topic-detail-breadcrumb'),
		).toBeInTheDocument()
	})
})
