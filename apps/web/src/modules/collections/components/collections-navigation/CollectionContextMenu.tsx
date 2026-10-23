import { FolderInput, Plus, Trash2 } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	useHoldPopoverOpen,
} from '~/components/ui'
import { iconSizes } from '~/styles/tokens.stylex'

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
					<Plus aria-hidden='true' size={iconSizes.sm} />
					Add subcollection
				</ContextMenuItem>
				<ContextMenuItem onClick={onMove}>
					<FolderInput aria-hidden='true' size={iconSizes.sm} />
					Move
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={onDelete}>
					<Trash2 aria-hidden='true' size={iconSizes.sm} />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
