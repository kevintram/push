import type { LucideIcon } from "lucide-react"
import { ChevronDown, Loader2, Plus, Search, SquarePen } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "~/components/ui/dropdown-menu"
import { cn } from "~/lib/utils"

type AddEntityMenuItem = {
	label: string
	onSelect: () => void
	icon?: LucideIcon
}

interface AddEntityMenuProps {
	disabled?: boolean
	isLoading?: boolean
	searchLabel?: string
	onSearch: () => void
	createItems: Array<AddEntityMenuItem>
	createLabel?: string
	buttonSize?:
		| "default"
		| "xs"
		| "sm"
		| "lg"
		| "icon"
		| "icon-xs"
		| "icon-sm"
		| "icon-lg"
	buttonClassName?: string
}

export function AddEntityMenu({
	disabled = false,
	isLoading = false,
	searchLabel = "Search",
	onSearch,
	createItems,
	createLabel = "Create new",
	buttonSize = "sm",
	buttonClassName
}: AddEntityMenuProps) {
	const singleCreateItem = createItems.length === 1 ? createItems[0] : null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={disabled || isLoading}
				render={
					<Button
						className={cn("gap-1", buttonClassName)}
						size={buttonSize}
						variant='secondary'
					>
						{isLoading ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Plus className='h-4 w-4' />
						)}
						Add
						<ChevronDown className='h-4 w-4' />
					</Button>
				}
			/>
			<DropdownMenuContent align='start'>
				{singleCreateItem ? (
					<DropdownMenuItem onClick={singleCreateItem.onSelect}>
						{singleCreateItem.icon ? (
							<singleCreateItem.icon className='h-4 w-4' />
						) : (
							<SquarePen className='h-4 w-4' />
						)}
						{singleCreateItem.label}
					</DropdownMenuItem>
				) : (
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<SquarePen className='h-4 w-4' />
							{createLabel}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{createItems.map(item => (
								<DropdownMenuItem key={item.label} onClick={item.onSelect}>
									{item.icon ? (
										<item.icon className='h-4 w-4' />
									) : (
										<SquarePen className='h-4 w-4' />
									)}
									{item.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				)}
				<DropdownMenuItem onClick={onSearch}>
					<Search className='h-4 w-4' />
					{searchLabel}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
