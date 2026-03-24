import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SidebarMenuButton, SidebarMenuItem } from '~/components/ui/sidebar'
import { SearchDialog } from '~/features/search/components/search-dialog/SearchDialog'

export function SidebarSearch() {
	const [searchOpen, setSearchOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault()
				setSearchOpen(true)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<SidebarMenuItem>
				<SidebarMenuButton
					onClick={() => setSearchOpen(true)}
					tooltip='Search (⌘K)'
				>
					<Search />
					<span>Search</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
			<SearchDialog
				onOpenChange={setSearchOpen}
				open={searchOpen}
				query={searchQuery}
				setQuery={setSearchQuery}
			/>
		</>
	)
}
