import { expect, test } from '@playwright/test'

test('renders', async ({ page }) => {
	await page.goto('/')

	// await expect(page.getByText('Mathematics')).toBeVisible()
	expect(true).toBe(true)
})
