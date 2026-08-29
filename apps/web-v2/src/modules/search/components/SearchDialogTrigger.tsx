import { formatForDisplay, useHotkey } from '@tanstack/react-hotkeys'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { SidebarItem } from '~/components/sidebar-item'
import {
	Dialog,
	DialogTrigger,
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui'

import { SEARCH_HOTKEY } from '../searchHotkey'
import { SearchDialog } from './SearchDialog'

export function SearchDialogTrigger() {
	const [isOpen, setIsOpen] = useState(false)

	useHotkey(SEARCH_HOTKEY, () => setIsOpen(true), {
		ignoreInputs: false,
		preventDefault: true,
		requireReset: true,
	})

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<DialogTrigger
							render={<SidebarItem icon={Search} text='Search' />}
						/>
					}
				/>
				<TooltipContent side='right'>
					Search
					<Kbd>{formatForDisplay(SEARCH_HOTKEY)}</Kbd>
				</TooltipContent>
			</Tooltip>
			{isOpen ? <SearchDialog /> : null}
		</Dialog>
	)
}
