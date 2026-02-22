import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWeekStart, WeekStartProvider } from '~/stores/WeekStartContext'

const WEEK_START_STORAGE_KEY = '3gulp-week-start-day'
const storage = new Map<string, string>()

const mockLocalStorage = {
	getItem: (key: string) => storage.get(key) ?? null,
	setItem: (key: string, value: string) => {
		storage.set(key, value)
	},
	removeItem: (key: string) => {
		storage.delete(key)
	}
}

function WeekStartProbe() {
	const { weekStartDay, setWeekStartDay } = useWeekStart()
	return (
		<div>
			<span data-testid='week-start-day'>{weekStartDay}</span>
			<button onClick={() => setWeekStartDay(1)} type='button'>
				Set Monday
			</button>
		</div>
	)
}

describe('WeekStartContext', () => {
	beforeEach(() => {
		storage.clear()
		Object.defineProperty(window, 'localStorage', {
			value: mockLocalStorage,
			configurable: true
		})
	})

	it('defaults to Sunday when no value is saved', () => {
		render(
			<WeekStartProvider>
				<WeekStartProbe />
			</WeekStartProvider>
		)

		expect(screen.getByTestId('week-start-day')).toHaveTextContent('0')
	})

	it('falls back to Sunday for invalid stored values', () => {
		window.localStorage.setItem(WEEK_START_STORAGE_KEY, 'invalid')

		render(
			<WeekStartProvider>
				<WeekStartProbe />
			</WeekStartProvider>
		)

		expect(screen.getByTestId('week-start-day')).toHaveTextContent('0')
	})

	it('restores valid stored values', () => {
		window.localStorage.setItem(WEEK_START_STORAGE_KEY, '6')

		render(
			<WeekStartProvider>
				<WeekStartProbe />
			</WeekStartProvider>
		)

		expect(screen.getByTestId('week-start-day')).toHaveTextContent('6')
	})

	it('persists updates in local storage', async () => {
		const user = userEvent.setup()

		render(
			<WeekStartProvider>
				<WeekStartProbe />
			</WeekStartProvider>
		)

		await user.click(screen.getByRole('button', { name: 'Set Monday' }))

		expect(screen.getByTestId('week-start-day')).toHaveTextContent('1')
		expect(window.localStorage.getItem(WEEK_START_STORAGE_KEY)).toBe('1')
	})
})
