import { expect, test } from '@playwright/test'

test('virtualized masonry mounts a window of items while scrolling', async ({
	page
}) => {
	await page.goto('/virtualization-smoke')

	const scrollContainer = page.getByTestId('virtualization-scroll-container')
	await expect(scrollContainer).toBeVisible()
	await expect(page.getByText('Virtual item 0')).toBeVisible()

	const mountedItemsAtTop = page.locator('[data-index]')
	const topCount = await mountedItemsAtTop.count()
	expect(topCount).toBeGreaterThan(0)
	expect(topCount).toBeLessThan(120)

	await scrollContainer.evaluate(node => {
		node.scrollTop = node.scrollHeight
	})

	await expect(page.getByText('Virtual item 399')).toBeVisible()
	await expect(page.getByText('Virtual item 0')).toHaveCount(0)

	const mountedItemsAtBottom = await page.locator('[data-index]').count()
	expect(mountedItemsAtBottom).toBeGreaterThan(0)
	expect(mountedItemsAtBottom).toBeLessThan(120)
})

test('virtualized masonry preserves scroll position when items append', async ({
	page
}) => {
	await page.goto('/virtualization-smoke')

	const scrollContainer = page.getByTestId('virtualization-scroll-container')
	const appendButton = page.getByTestId('virtualization-append-items')
	await expect(scrollContainer).toBeVisible()
	await expect(appendButton).toBeVisible()

	const before = await scrollContainer.evaluate(node => {
		node.scrollTop = node.scrollHeight
		return {
			scrollTop: node.scrollTop,
			scrollHeight: node.scrollHeight
		}
	})

	expect(before.scrollTop).toBeGreaterThan(0)

	await appendButton.click()

	await expect
		.poll(async () => {
			return await scrollContainer.evaluate(node => node.scrollHeight)
		})
		.toBeGreaterThan(before.scrollHeight)

	const afterTop = await scrollContainer.evaluate(node => node.scrollTop)

	expect(afterTop).toBeGreaterThan(100)
	expect(afterTop).toBeGreaterThan(before.scrollTop - 2000)
})
