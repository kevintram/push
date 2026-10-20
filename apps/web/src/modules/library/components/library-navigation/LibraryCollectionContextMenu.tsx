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
import { iconSizes, iconWeights } from '~/styles/tokens.stylex'

type LibraryCollectionContextMenuProps = {
	trigger: ReactElement
	onCreateSubcollection: () => void
	onMove: () => void
	onDelete: () => void
}

export function LibraryCollectionContextMenu({
	trigger,
	onCreateSubcollection,
	onMove,
	onDelete,
}: LibraryCollectionContextMenuProps) {
	const [open, setOpen] = useState(false)
	useHoldPopoverOpen(open)

	return (
		<ContextMenu onOpenChange={setOpen}>
			<ContextMenuTrigger render={trigger} />
			<ContextMenuContent>
				<ContextMenuItem onClick={onCreateSubcollection}>
					<Plus
						aria-hidden='true'
						size={iconSizes.sm}
						strokeWidth={iconWeights.medium}
					/>
					Add subcollection
				</ContextMenuItem>
				<ContextMenuItem onClick={onMove}>
					<FolderInput
						aria-hidden='true'
						size={iconSizes.sm}
						strokeWidth={iconWeights.medium}
					/>
					Move
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={onDelete}>
					<Trash2
						aria-hidden='true'
						size={iconSizes.sm}
						strokeWidth={iconWeights.medium}
					/>
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
