import { type LinkProps } from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'

export type SidebarLinkCommonProps = {
	params?: LinkProps['params']
	to: LinkProps['to']
	text?: string
	ariaLabel?: string
}

export type SidebarLinkFatProps = SidebarLinkCommonProps & {
	icon: LucideIcon
}
