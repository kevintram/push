import { Search } from 'lucide-react'
import { useState } from 'react'

import { SidebarItem } from '~/components/sidebar-item'
import { Dialog, DialogTrigger } from '~/components/ui'

import { SearchDialog } from './SearchDialog'

// TODO(3): open the search dialog with a ⌘K / Ctrl+K hotkey
export function SearchDialogTrigger() {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger
				render={<SidebarItem icon={Search} text='Search' />}
			/>
			{isOpen ? <SearchDialog /> : null}
		</Dialog>
	)
}
