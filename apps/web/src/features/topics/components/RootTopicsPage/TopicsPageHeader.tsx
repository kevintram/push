type TopicsPageHeaderProps = {
	title?: string
}

export function TopicsPageHeader({ title = 'Topics' }: TopicsPageHeaderProps) {
	return (
		<div className='sticky top-0 z-10 rounded-tl-sm border-tl-2 border-b-1 bg-primary-foreground/40 px-4 pt-4 pb-4 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='font-bold text-xl'>{title}</h1>
			</div>
		</div>
	)
}
