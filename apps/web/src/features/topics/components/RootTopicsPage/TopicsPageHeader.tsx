import type { LucideIcon } from 'lucide-react'

type TopicsPageHeaderProps = {
	title?: string
	icon?: LucideIcon
}

export function TopicsPageHeader({
	title = 'Topics',
	icon: Icon
}: TopicsPageHeaderProps) {
	return (
		<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-4 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='flex items-center gap-2 font-bold text-xl'>
					{Icon && <Icon className='h-5 w-5' />}
					{title}
				</h1>
			</div>
		</div>
	)
}
