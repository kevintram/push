type TopicsPageLayoutProps = {
	children: React.ReactNode
}

export function TopicsPageLayout({ children }: TopicsPageLayoutProps) {
	return (
		<div className='scrollbar-track-transparent relative h-full w-full'>
			<div className='flex h-full flex-col overflow-auto'>{children}</div>
		</div>
	)
}
