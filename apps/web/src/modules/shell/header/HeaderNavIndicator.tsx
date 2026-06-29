import { type ReactNode } from 'react'

export function HeaderNavIndicator({ children }: { children?: ReactNode }) {
	if (!children) return null

	return (
		<span
			aria-hidden={true}
			className='pointer-events-none absolute top-1 right-1 z-10 inline-flex items-center justify-center'
		>
			{children}
		</span>
	)
}
