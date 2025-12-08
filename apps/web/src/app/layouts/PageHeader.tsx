import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
	title: string
	icon?: LucideIcon
	children?: ReactNode
}

export function PageHeader({ title, icon: Icon, children }: PageHeaderProps) {
	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='flex items-center gap-2 font-bold text-xl'>
					{Icon && <Icon className='h-5 w-5' />}
					{title}
					{children}
				</h1>
			</div>
		</div>
	)
}
