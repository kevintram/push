import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

import { cn } from '~/lib/utils'

export interface PageLayoutHeaderProps {
	title: string
	icon?: LucideIcon
	titleExtra?: ReactNode
	actions?: ReactNode
	centerContent?: ReactNode
	children?: ReactNode
}

export function PageLayoutHeader({
	title,
	icon: Icon,
	titleExtra,
	actions,
	centerContent,
	children,
}: PageLayoutHeaderProps) {
	const hasCenterContent = centerContent != null

	return (
		<div className='sticky top-0 z-10 flex flex-col gap-1 border-b-1 bg-background/40 px-3 py-2.5 backdrop-blur-sm'>
			<div
				className={cn(
					'items-center gap-1',
					hasCenterContent
						? 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
						: 'flex justify-between',
				)}
			>
				<div
					className={cn(
						'flex min-w-0 items-center gap-2',
						hasCenterContent && 'justify-self-start',
					)}
				>
					<h1 className='flex min-w-0 items-center gap-2 font-bold text-xl'>
						{Icon ? <Icon className='h-5 w-5 shrink-0' /> : null}
						<span className='truncate'>{title}</span>
					</h1>
					{titleExtra}
				</div>
				{hasCenterContent ? (
					<div className='flex items-center justify-center'>
						{centerContent}
					</div>
				) : null}
				{hasCenterContent ? (
					<div className='flex min-w-0 items-center justify-end'>
						{actions}
					</div>
				) : (
					actions
				)}
			</div>
			{children}
		</div>
	)
}
