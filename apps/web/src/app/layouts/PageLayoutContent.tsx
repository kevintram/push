import { type ReactNode } from 'react'

import { cn } from '~/lib/utils'

export interface PageLayoutContentProps {
	children: ReactNode
	className?: string
	controls?: ReactNode
}

export function PageLayoutContent({
	children,
	className,
	controls,
}: PageLayoutContentProps) {
	return (
		<div className={cn('mx-auto w-full max-w-5xl p-4', className)}>
			{controls ? <div className='mb-3'>{controls}</div> : null}
			{children}
		</div>
	)
}
