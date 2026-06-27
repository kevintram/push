import { type ReactNode } from 'react'
import { createContext, useCallback, useContext, useRef } from 'react'

import {
	PageLayoutContent,
	type PageLayoutContentProps,
	PageLayoutHeader,
	type PageLayoutHeaderProps,
} from '~/app/layouts/PageLayoutComponents'

interface PageLayoutProps {
	children: ReactNode
}

type PageLayoutComponent = ((props: PageLayoutProps) => ReactNode) & {
	Header: (props: PageLayoutHeaderProps) => ReactNode
	Content: (props: PageLayoutContentProps) => ReactNode
}

const PageLayoutScrollContext = createContext<
	(() => HTMLDivElement | null) | null
>(null)

export function usePageScrollElement() {
	return useContext(PageLayoutScrollContext)
}

export const PageLayout: PageLayoutComponent = function PageLayout({
	children,
}: PageLayoutProps) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const getScrollElement = useCallback(() => scrollRef.current, [])

	return (
		<PageLayoutScrollContext.Provider value={getScrollElement}>
			<div className='scrollbar-track-transparent relative h-full w-full'>
				<div
					className='flex h-full flex-col overflow-auto'
					ref={scrollRef}
				>
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
