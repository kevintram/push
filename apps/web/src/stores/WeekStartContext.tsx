import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState
} from 'react'

const WEEK_START_STORAGE_KEY = '3gulp-week-start-day'

export type WeekStartDay = 6 | 0 | 1

export const WEEK_START_OPTIONS: Array<{ value: WeekStartDay; label: string }> =
	[
		{ value: 6, label: 'Saturday' },
		{ value: 0, label: 'Sunday' },
		{ value: 1, label: 'Monday' }
	]

type WeekStartContextType = {
	weekStartDay: WeekStartDay
	setWeekStartDay: (value: WeekStartDay) => void
}

const WeekStartContext = createContext<WeekStartContextType | undefined>(
	undefined
)

function isWeekStartDay(value: number): value is WeekStartDay {
	return value === 6 || value === 0 || value === 1
}

function getInitialWeekStartDay(): WeekStartDay {
	if (typeof window === 'undefined') return 0

	const storedValue = window.localStorage.getItem(WEEK_START_STORAGE_KEY)
	if (storedValue === null) return 0

	const parsed = Number.parseInt(storedValue, 10)
	if (!isWeekStartDay(parsed)) return 0

	return parsed
}

interface WeekStartProviderProps {
	children: React.ReactNode
}

export function WeekStartProvider({ children }: WeekStartProviderProps) {
	const [weekStartDay, setWeekStartDayState] = useState<WeekStartDay>(
		getInitialWeekStartDay
	)

	const setWeekStartDay = useCallback((value: WeekStartDay) => {
		window.localStorage.setItem(WEEK_START_STORAGE_KEY, String(value))
		setWeekStartDayState(value)
	}, [])

	const value = useMemo(
		() => ({ weekStartDay, setWeekStartDay }),
		[setWeekStartDay, weekStartDay]
	)

	return <WeekStartContext value={value}>{children}</WeekStartContext>
}

export function useWeekStart() {
	const context = useContext(WeekStartContext)

	if (!context) {
		throw new Error('WeekStartProvider is required')
	}

	return context
}
