import { Link } from '@tanstack/react-router'
import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'
import { HeaderIconButton } from '~/modules/shell/header/HeaderIconButton'
import { HeaderNavIndicator } from '~/modules/shell/header/HeaderNavIndicator'

type NavLinkTarget = '/due' | '/flagged' | '/recent' | '/logbook'

export function HeaderNavLink({
	to,
	label,
	icon: Icon,
	isActive,
	indicator,
	rawIndicator,
}: {
	to: NavLinkTarget
	label: string
	icon: LucideIcon
	isActive: boolean
	indicator?: ReactNode
	rawIndicator?: ReactNode
}): ReactNode {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<HeaderIconButton
						ariaLabel={label}
						className={cn(
							'relative size-7.5 px-0',
							isActive &&
								'bg-[var(--app-chrome-selected)] text-[var(--app-chrome-selected-foreground)]',
						)}
						nativeButton={false}
						render={<Link to={to} />}
						showNativeTitle={false}
					>
						<Icon />
						<HeaderNavIndicator>{indicator}</HeaderNavIndicator>
						{rawIndicator}
					</HeaderIconButton>
				}
			/>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	)
}
