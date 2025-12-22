import { createFileRoute, redirect } from '@tanstack/react-router'
import Cookies from 'js-cookie'

const FIRST_TIME_COOKIE = 'first_time'

export const Route = createFileRoute('/_main/')({
	beforeLoad: () => {
		const isFirstTime = Cookies.get(FIRST_TIME_COOKIE)

		if (isFirstTime) {
			throw redirect({ to: '/scheduled' })
		}

		Cookies.set(FIRST_TIME_COOKIE, 'true', { expires: 365 })
		throw redirect({ to: '/home' })
	}
})
