import { Menu } from '@base-ui/react/menu'

import { DropdownMenuContent } from './DropdownMenuContent'

export {
	DropdownMenuCheckboxItem,
	type DropdownMenuCheckboxItemProps,
} from './DropdownMenuCheckboxItem'
export {
	DropdownMenuContent,
	type DropdownMenuContentProps,
} from './DropdownMenuContent'
export {
	DropdownMenuItem,
	type DropdownMenuItemProps,
} from './DropdownMenuItem'
export {
	DropdownMenuLabel,
	type DropdownMenuLabelProps,
} from './DropdownMenuLabel'
export {
	DropdownMenuRadioItem,
	type DropdownMenuRadioItemProps,
} from './DropdownMenuRadioItem'
export { DropdownMenuSeparator } from './DropdownMenuSeparator'
export { DropdownMenuShortcut } from './DropdownMenuShortcut'
export {
	DropdownMenuSubTrigger,
	type DropdownMenuSubTriggerProps,
} from './DropdownMenuSubTrigger'

export const DropdownMenu = Menu.Root
export const DropdownMenuGroup = Menu.Group
export const DropdownMenuPortal = Menu.Portal
export const DropdownMenuRadioGroup = Menu.RadioGroup
export const DropdownMenuSub = Menu.SubmenuRoot
export const DropdownMenuSubContent = DropdownMenuContent
export const DropdownMenuTrigger = Menu.Trigger
