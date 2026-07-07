import { type LinkProps } from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'

export type BaseSidebarLinkProps = {
	icon: LucideIcon
	to: LinkProps['to']
	text?: string
	ariaLabel?: string
}

export type SidebarLinkVariant = 'fat' | 'skinny'
