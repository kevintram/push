import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '~/lib/utils'

export interface PageLayoutHeaderProps {
	title: string
	icon?: LucideIcon
	titleExtra?: ReactNode
	actions?: ReactNode
	centerContent?: ReactNode
	children?: ReactNode
}

export interface PageLayoutContentProps {
	children: ReactNode
	className?: string
}

export function PageLayoutHeader({
	title,
	icon: Icon,
	titleExtra,
	actions,
	centerContent,
	children
}: PageLayoutHeaderProps) {
	const hasCenterContent = centerContent != null

	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 border-b-1 bg-background/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
			<div
				className={cn(
					'items-center gap-2',
					hasCenterContent
						? 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
						: 'flex justify-between'
				)}
			>
				<h1
					className={cn(
						'flex min-w-0 items-center gap-2 font-bold text-xl',
						hasCenterContent && 'justify-self-start'
					)}
				>
					{Icon ? <Icon className='h-5 w-5 shrink-0' /> : null}
					<span className='truncate'>{title}</span>
					{titleExtra}
				</h1>
				{hasCenterContent ? (
					<div className='flex items-center justify-center'>{centerContent}</div>
				) : null}
				{hasCenterContent ? (
					<div className='flex min-w-0 items-center justify-end'>{actions}</div>
				) : (
					actions
				)}
			</div>
			{children}
		</div>
	)
}

export function PageLayoutContent({
	children,
	className
}: PageLayoutContentProps) {
	return (
		<div className={cn('mx-auto w-full max-w-5xl p-6', className)}>
			{children}
		</div>
	)
}
