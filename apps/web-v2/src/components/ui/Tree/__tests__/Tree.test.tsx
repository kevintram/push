import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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
				<TreeItem collapsible label='Parent'>
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

	it('supports Base UI uncontrolled and controlled open state', async () => {
		const user = userEvent.setup()
		const onUncontrolledOpenChange = vi.fn()
		const onOpenChange = vi.fn()

		const { rerender } = render(
			<Tree>
				<TreeItem
					collapsible
					defaultOpen={false}
					label='Uncontrolled'
					onOpenChange={onUncontrolledOpenChange}
				>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel>Uncontrolled</TreeItemLabel>
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

		expect(
			screen.getByRole('button', { name: 'Expand Uncontrolled' }),
		).toHaveAttribute('aria-expanded', 'false')
		await user.click(
			screen.getByRole('button', { name: 'Expand Uncontrolled' }),
		)
		expect(
			screen.getByRole('button', { name: 'Collapse Uncontrolled' }),
		).toHaveAttribute('aria-expanded', 'true')
		expect(onUncontrolledOpenChange).toHaveBeenCalledWith(
			true,
			expect.anything(),
		)

		rerender(
			<Tree>
				<TreeItem
					collapsible
					key='controlled'
					label='Controlled'
					open={false}
					onOpenChange={onOpenChange}
				>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel>Controlled</TreeItemLabel>
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

		await user.click(
			screen.getByRole('button', { name: 'Expand Controlled' }),
		)
		expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
		expect(
			screen.getByRole('button', { name: 'Expand Controlled' }),
		).toHaveAttribute('aria-expanded', 'false')

		rerender(
			<Tree>
				<TreeItem
					collapsible
					key='controlled'
					label='Controlled'
					open
					onOpenChange={onOpenChange}
				>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger />
						<TreeItemLabel>Controlled</TreeItemLabel>
					</TreeItemContent>
				</TreeItem>
			</Tree>,
		)
		expect(
			screen.getByRole('button', { name: 'Collapse Controlled' }),
		).toHaveAttribute('aria-expanded', 'true')
	})

	it('preserves a custom collapsible trigger label across open states', async () => {
		const user = userEvent.setup()

		render(
			<Tree>
				<TreeItem collapsible label='Parent'>
					<TreeItemContent>
						<TreeItemCollapsibleTrigger aria-label='Toggle branch' />
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

		const trigger = screen.getByRole('button', { name: 'Toggle branch' })
		expect(trigger).toHaveAttribute('aria-expanded', 'true')

		await user.click(trigger)

		expect(
			screen.getByRole('button', { name: 'Toggle branch' }),
		).toHaveAttribute('aria-expanded', 'false')
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
