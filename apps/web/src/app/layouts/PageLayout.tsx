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
	actions?: ReactNode
	centerContent?: ReactNode
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
	actions,
	centerContent,
	children
}: PageLayoutHeaderProps) {
	return (
		<div className='sticky top-0 z-10 flex flex-col gap-2 border-b-1 bg-background/40 px-4 pt-4 pb-2 backdrop-blur-sm'>
			<div
				className={cn(
					'items-center gap-2',
					centerContent == null
						? 'flex justify-between'
						: 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'
				)}
			>
				<h1
					className={cn(
						'flex min-w-0 items-center gap-2 font-bold text-xl',
						centerContent != null && 'justify-self-start'
					)}
				>
					{Icon && <Icon className='h-5 w-5 shrink-0' />}
					<span className='truncate'>{title}</span>
					{titleExtra}
				</h1>
				{centerContent != null ? (
					<div className='flex items-center justify-center'>
						{centerContent}
					</div>
				) : null}
				{centerContent != null ? (
					<div className='flex min-w-0 items-center justify-end'>{actions}</div>
				) : (
					actions
				)}
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
