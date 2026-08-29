import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
	Tree,
	TreeItem,
	TreeItemChildren,
	TreeItemCollapsibleTrigger,
	TreeItemContent,
	TreeItemLabel,
} from '..'

describe('Tree', () => {
	it('renders nested list semantics and collapses children', async () => {
		const user = userEvent.setup()

		const { container } = render(
			<Tree aria-label='Collections'>
				<TreeItem expandable label='Parent'>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel>Parent</TreeItemLabel>
					</TreeItemContent>
					<TreeItemChildren>
						<TreeItem label='Child'>
							<TreeItemContent>
								<TreeItemCollapsibleTrigger />
								<TreeItemLabel>Child</TreeItemLabel>
							</TreeItemContent>
						</TreeItem>
					</TreeItemChildren>
				</TreeItem>
			</Tree>,
		)

		expect(container.querySelectorAll('ul')).toHaveLength(2)
		expect(container.querySelectorAll('li')).toHaveLength(2)

		await user.click(
			screen.getByRole('button', { name: 'Collapse Parent' }),
		)

		expect(
			screen.queryByRole('button', { name: 'Child' }),
		).not.toBeInTheDocument()
		expect(screen.getByText('Child')).toBeInTheDocument()
	})

	it('renders an alignment placeholder for a leaf item', () => {
		const { container } = render(
			<Tree>
				<TreeItem label='Leaf'>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel>Leaf</TreeItemLabel>
					</TreeItemContent>
				</TreeItem>
			</Tree>,
		)

		expect(
			container.querySelector(
				'[data-slot="tree-item-collapsible-placeholder"]',
			),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: /Leaf/ }),
		).toHaveAccessibleName('Leaf')
	})

	it('supports a custom primary action through the label render prop', () => {
		render(
			<Tree>
				<TreeItem label='Linked item' selected>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel render={<a href='/linked-item' />}>
							Linked item
						</TreeItemLabel>
					</TreeItemContent>
				</TreeItem>
			</Tree>,
		)

		expect(
			screen.getByRole('link', { name: 'Linked item' }),
		).toHaveAttribute('href', '/linked-item')
	})
})
