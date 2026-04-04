import { User2 } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { CardHeader } from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/tooltip'
import type { ReviewCardBadge } from './reviewCardShared'

export function ReviewCardStatusRow({
	badges
}: {
	badges: Array<ReviewCardBadge>
}) {
	if (badges.length === 0) return null

	return (
		<div className='pointer-events-none absolute top-[0.5px] right-3 z-5 flex max-w-[calc(100%-1.5rem)] -translate-y-1/2 flex-wrap items-center justify-end gap-1.5'>
			{badges.map((badge, index) => (
				<Tooltip key={`${badge.label}-${index}`}>
					<TooltipTrigger
						render={
							<Badge
								className={
									badge.className
										? `${badge.className} pointer-events-auto rounded-sm shadow-sm`
										: 'pointer-events-auto h-5 rounded-sm text-xs shadow-sm'
								}
								onClick={event => {
									if (!badge.onClick) return
									event.stopPropagation()
									badge.onClick()
								}}
								onKeyDown={event => {
									if (
										(event.key === 'Enter' || event.key === ' ') &&
										badge.onClick
									) {
										event.preventDefault()
										event.stopPropagation()
										badge.onClick()
									}
								}}
								role={badge.onClick ? 'button' : undefined}
								tabIndex={badge.onClick ? 0 : undefined}
								variant={badge.variant ?? 'outline'}
							>
								{badge.icon ? (
									<span className='inline-flex items-center'>{badge.icon}</span>
								) : null}
								{badge.label ? <span>{badge.label}</span> : null}
							</Badge>
						}
					/>
					{badge.tooltip ? (
						<TooltipContent>{badge.tooltip}</TooltipContent>
					) : null}
				</Tooltip>
			))}
		</div>
	)
}

type ReviewCardHeaderProps = {
	hideParent: boolean
	resolvedParentLabel: string
	typeBadgeLabel: string
}

export function ReviewCardHeader({
	hideParent,
	resolvedParentLabel,
	typeBadgeLabel
}: ReviewCardHeaderProps) {
	return (
		<CardHeader className='relative flex items-center gap-2 p-0 pb-1'>
			<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
				{hideParent ? null : (
					<>
						<User2 className='h-3 w-3 shrink-0' />
						<Tooltip>
							<TooltipTrigger
								render={<span className='truncate'>{resolvedParentLabel}</span>}
							/>
							<TooltipContent>{resolvedParentLabel}</TooltipContent>
						</Tooltip>
						<span aria-hidden={true}>·</span>
					</>
				)}
				<span>{typeBadgeLabel}</span>
			</div>
		</CardHeader>
	)
}
