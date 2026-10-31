import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '..'

function renderTabs(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
	return render(
		<Tabs defaultValue='account' {...props}>
			<TabsList>
				<TabsTrigger value='account'>Account</TabsTrigger>
				<TabsTrigger value='password'>Password</TabsTrigger>
				<TabsTrigger value='disabled' disabled>
					Disabled
				</TabsTrigger>
			</TabsList>
			<TabsContent value='account'>Account settings</TabsContent>
			<TabsContent value='password'>Password settings</TabsContent>
			<TabsContent value='disabled'>Disabled settings</TabsContent>
		</Tabs>,
	)
}

describe('Tabs', () => {
	it('shows the default panel and changes panels on click', async () => {
		const user = userEvent.setup()
		renderTabs()

		expect(screen.getByRole('tabpanel')).toHaveTextContent(
			'Account settings',
		)

		await user.click(screen.getByRole('tab', { name: 'Password' }))

		expect(screen.getByRole('tabpanel')).toHaveTextContent(
			'Password settings',
		)
		expect(screen.getByRole('tab', { name: 'Password' })).toHaveAttribute(
			'aria-selected',
			'true',
		)
	})

	it('supports keyboard navigation', async () => {
		const user = userEvent.setup()
		renderTabs()
		const accountTab = screen.getByRole('tab', { name: 'Account' })

		await user.click(accountTab)
		await user.keyboard('{ArrowRight}')
		expect(screen.getByRole('tab', { name: 'Password' })).toHaveFocus()
	})

	it('does not activate a disabled tab', async () => {
		const user = userEvent.setup()
		renderTabs()

		await user.click(screen.getByRole('tab', { name: 'Disabled' }))

		expect(screen.getByRole('tabpanel')).toHaveTextContent(
			'Account settings',
		)
	})

	it('supports controlled values', async () => {
		const user = userEvent.setup()
		const onValueChange = vi.fn()
		renderTabs({
			defaultValue: undefined,
			onValueChange,
			value: 'account',
		})

		await user.click(screen.getByRole('tab', { name: 'Password' }))

		expect(onValueChange).toHaveBeenCalledWith(
			'password',
			expect.anything(),
		)
		expect(screen.getByRole('tabpanel')).toHaveTextContent(
			'Account settings',
		)
	})

	it('supports vertical orientation and line styling', () => {
		render(
			<Tabs defaultValue='account' orientation='vertical'>
				<TabsList variant='line'>
					<TabsTrigger value='account'>Account</TabsTrigger>
				</TabsList>
				<TabsContent value='account'>Account settings</TabsContent>
			</Tabs>,
		)

		expect(screen.getByRole('tablist')).toHaveAttribute(
			'aria-orientation',
			'vertical',
		)
	})

	it('forwards keepMounted to inactive panels', () => {
		render(
			<Tabs defaultValue='account'>
				<TabsList>
					<TabsTrigger value='account'>Account</TabsTrigger>
					<TabsTrigger value='password'>Password</TabsTrigger>
				</TabsList>
				<TabsContent value='account'>Account settings</TabsContent>
				<TabsContent value='password' keepMounted>
					Password settings
				</TabsContent>
			</Tabs>,
		)

		expect(screen.getByText('Password settings')).not.toBeVisible()
	})
})
