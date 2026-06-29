import { User2 } from 'lucide-react'

import { CardHeader } from '~/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'

type ReviewCardHeaderProps = {
	hideParent: boolean
	resolvedParentLabel: string
	typeBadgeLabel: string
}

export function ReviewCardHeader({
	hideParent,
	resolvedParentLabel,
	typeBadgeLabel,
}: ReviewCardHeaderProps) {
	return (
		<CardHeader className='relative flex items-center gap-2 p-0 pb-1'>
			<div className='flex min-w-0 items-center gap-1 font-semibold text-muted-foreground text-xs'>
				{hideParent ? null : (
					<>
						<User2 className='h-3 w-3 shrink-0' />
						<Tooltip>
							<TooltipTrigger
								render={
									<span className='truncate'>
										{resolvedParentLabel}
									</span>
								}
							/>
							<TooltipContent>
								{resolvedParentLabel}
							</TooltipContent>
						</Tooltip>
						<span aria-hidden={true}>·</span>
					</>
				)}
				<span>{typeBadgeLabel}</span>
			</div>
		</CardHeader>
	)
}
