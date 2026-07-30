import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@workos-inc/authkit-react'
import { useEffect } from 'react'

import { LoaderPage } from './LoaderPage'

export function AuthCallbackPage() {
	const { isLoading } = useAuth()
	const navigate = useNavigate({ from: '/callback' })

	useEffect(() => {
		if (!isLoading) {
			void navigate({
				to: '/settings',
				replace: true,
			})
		}
	}, [isLoading, navigate])

	return <LoaderPage />
}
