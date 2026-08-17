import type { Id } from '@convex/_generated/dataModel'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { TopicWithChildren } from '~/modules/library/types/topic.types'

import { MoveTopicLink } from '../MoveTopicLink'

function topic(
	id: string,
	childTopics: Array<TopicWithChildren> = [],
): TopicWithChildren {
	return {
		_id: id as Id<'topics'>,
		_creationTime: 0,
		title: id,
		description: '',
		ownerId: 'owner',
		childTopics,
	}
}

describe('MoveTopicLink', () => {
	it('collapses nested topics and keeps their state mounted', async () => {
		const user = userEvent.setup()

		render(
			<ul>
				<MoveTopicLink
					{...topic('parent', [
						topic('child', [topic('grandchild')]),
					])}
					onSelect={vi.fn()}
					selectedTopicId={'parent' as Id<'topics'>}
				/>
			</ul>,
		)

		await user.click(screen.getByRole('button', { name: 'Collapse child' }))
		await user.click(
			screen.getByRole('button', { name: 'Collapse parent' }),
		)

		expect(
			screen.queryByRole('button', { name: 'child' }),
		).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Expand parent' }))

		expect(
			screen.getByRole('button', { name: 'child' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Expand child' }),
		).toHaveAttribute('aria-expanded', 'false')
		expect(
			screen.queryByRole('button', { name: 'grandchild' }),
		).not.toBeInTheDocument()
	})
})
