import { render, screen, within } from '@testing-library/react'
import { Slash } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '..'

function renderBreadcrumb() {
	return render(
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink href='/library'>Library</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<BreadcrumbPage>TypeScript</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>,
	)
}

describe('Breadcrumb', () => {
	it('renders a labeled navigation landmark and ordered list', () => {
		renderBreadcrumb()

		const breadcrumb = screen.getByRole('navigation', {
			name: 'Breadcrumb',
		})
		expect(within(breadcrumb).getByRole('list')).toBeInTheDocument()
		expect(
			within(breadcrumb).getByRole('link', { name: 'Library' }),
		).toHaveAttribute('href', '/library')
	})

	it('allows a custom accessible label', () => {
		render(<Breadcrumb aria-label='Topic hierarchy' />)

		expect(
			screen.getByRole('navigation', { name: 'Topic hierarchy' }),
		).toBeInTheDocument()
	})

	it('marks the current page without presenting it as an interactive link', () => {
		renderBreadcrumb()

		const currentPage = screen.getByText('TypeScript')
		expect(currentPage).toHaveAttribute('aria-current', 'page')
		expect(currentPage).not.toHaveAttribute('role', 'link')
	})

	it('keeps separators out of the accessibility tree', () => {
		const { container } = renderBreadcrumb()
		const separator = container.querySelector(
			'[data-slot="breadcrumb-separator"]',
		)

		expect(separator).toHaveAttribute('aria-hidden', 'true')
		expect(separator).toHaveAttribute('role', 'presentation')
	})

	it('supports custom separators and a presentational ellipsis', () => {
		const { container } = render(
			<BreadcrumbList>
				<BreadcrumbSeparator>
					<Slash data-testid='custom-separator' />
				</BreadcrumbSeparator>
				<BreadcrumbItem>
					<BreadcrumbEllipsis />
				</BreadcrumbItem>
			</BreadcrumbList>,
		)

		expect(screen.getByTestId('custom-separator')).toBeInTheDocument()
		expect(
			container.querySelector('[data-slot="breadcrumb-ellipsis"]'),
		).toHaveAttribute('aria-hidden', 'true')
	})

	it('supports Base UI render composition', () => {
		render(
			<BreadcrumbLink render={<a href='/library/typescript' />}>
				TypeScript
			</BreadcrumbLink>,
		)

		expect(
			screen.getByRole('link', { name: 'TypeScript' }),
		).toHaveAttribute('href', '/library/typescript')
	})
})
