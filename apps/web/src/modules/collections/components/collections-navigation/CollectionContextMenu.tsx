import { type ReactElement, useState } from 'react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	useHoldPopoverOpen,
} from '~/components/ui'

type CollectionContextMenuProps = {
	trigger: ReactElement
	onCreateSubcollection: () => void
	onMove: () => void
	onDelete: () => void
}

export function CollectionContextMenu({
	trigger,
	onCreateSubcollection,
	onMove,
	onDelete,
}: CollectionContextMenuProps) {
	const [open, setOpen] = useState(false)
	useHoldPopoverOpen(open)

	return (
		<ContextMenu onOpenChange={setOpen}>
			<ContextMenuTrigger render={trigger} />
			<ContextMenuContent>
				<ContextMenuItem onClick={onCreateSubcollection}>
					Add subcollection
				</ContextMenuItem>
				<ContextMenuItem onClick={onMove}>Move</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={onDelete}>Delete</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
