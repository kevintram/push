import { expect, test } from '@playwright/test'

test('renders the fruit gallery and choose one', async ({ page }) => {
	await page.goto('/')

	await page.getByRole('link', { name: 'Apple' }).click()

	await expect(page.getByRole('heading', { name: 'Apple' })).toBeVisible()
	await expect(page.getByText('Vitamin K')).toBeVisible()
})
