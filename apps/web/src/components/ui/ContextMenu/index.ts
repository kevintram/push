import { ContextMenu as ContextMenuPrimitive } from '@base-ui/react/context-menu'

import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
} from '../DropdownMenu'

export type {
	DropdownMenuContentProps as ContextMenuContentProps,
	DropdownMenuItemProps as ContextMenuItemProps,
	DropdownMenuLabelProps as ContextMenuLabelProps,
	DropdownMenuSubTriggerProps as ContextMenuSubTriggerProps,
} from '../DropdownMenu'

export const ContextMenu = ContextMenuPrimitive.Root
export const ContextMenuCheckboxItem = DropdownMenuCheckboxItem
export const ContextMenuContent = DropdownMenuContent
export const ContextMenuGroup = DropdownMenuGroup
export const ContextMenuItem = DropdownMenuItem
export const ContextMenuLabel = DropdownMenuLabel
export const ContextMenuPortal = DropdownMenuPortal
export const ContextMenuRadioGroup = DropdownMenuRadioGroup
export const ContextMenuRadioItem = DropdownMenuRadioItem
export const ContextMenuSeparator = DropdownMenuSeparator
export const ContextMenuShortcut = DropdownMenuShortcut
export const ContextMenuSub = DropdownMenuSub
export const ContextMenuSubContent = DropdownMenuContent
export const ContextMenuSubTrigger = DropdownMenuSubTrigger
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger
