import { SidebarItem, type SidebarItemProps } from './SidebarItem'

export interface SidebarItemIconProps extends Omit<
	SidebarItemProps,
	'children' | 'iconOnly'
> {
	children?: React.ReactNode
}

export function SidebarItemIcon({ ...props }: SidebarItemIconProps) {
	return <SidebarItem {...props} iconOnly />
}
