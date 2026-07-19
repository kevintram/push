import {
	type RegisteredRouter,
	type ValidateLinkOptions,
} from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'

export type SidebarLinkCommonProps<TOptions> = ValidateLinkOptions<
	RegisteredRouter,
	TOptions
> & {
	text?: string
	ariaLabel?: string
}

export type SidebarLinkFatProps<TOptions> = SidebarLinkCommonProps<TOptions> & {
	icon: LucideIcon
}
