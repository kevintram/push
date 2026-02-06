import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useRef } from 'react'
import { cn } from '~/lib/utils'

interface PageLayoutProps {
	children: ReactNode
}

interface PageLayoutHeaderProps {
	title: string
	icon?: LucideIcon
	titleExtra?: ReactNode
	children?: ReactNode
}

interface PageLayoutContentProps {
	children: ReactNode
	className?: string
}

const PageLayoutScrollContext = createContext<
	(() => HTMLDivElement | null) | null
>(null)

export function usePageScrollElement() {
	return useContext(PageLayoutScrollContext)
}

function PageLayoutHeader({
	title,
	icon: Icon,
	titleExtra,
	children
}: PageLayoutHeaderProps) {
	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 border-b-1 bg-background/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
			<div className='flex items-center justify-between'>
				<h1 className='flex items-center gap-2 font-bold text-xl'>
					{Icon && <Icon className='h-5 w-5' />}
					{title}
					{titleExtra}
				</h1>
			</div>
			{children}
		</div>
	)
}

function PageLayoutContent({ children, className }: PageLayoutContentProps) {
	return (
		<div className={cn('mx-auto w-full max-w-5xl p-6', className)}>
			{children}
		</div>
	)
}

export function PageLayout({ children }: PageLayoutProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollRef.current, [])

	return (
		<PageLayoutScrollContext.Provider value={getScrollElement}>
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div className='flex h-full flex-col overflow-auto' ref={scrollRef}>
					{children}
				</div>
			</div>
		</PageLayoutScrollContext.Provider>
	)
}

PageLayout.Header = PageLayoutHeader
PageLayout.Content = PageLayoutContent

// Export PageHeader for backward compatibility with other pages
export const PageHeader = PageLayoutHeader
