import { Link } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger
} from '~/components/ui/DropdownMenu'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger
} from '~/components/ui/Tooltip'

interface TopicBadgeProps {
	topicId: number
	name?: string | null
	notes?: string | null
	menuItems: ReactNode
}

export function TopicBadge({
	topicId,
	name,
	notes,
	menuItems
}: TopicBadgeProps) {
	const displayText = name ? name : notes

	return (
		<div className='group'>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild={true}>
						<Badge
							className='relative flex min-w-16 cursor-pointer items-center px-2 py-1 text-xs hover:bg-secondary/80'
							variant='secondary'
						>
							<Link
								className='max-w-32 flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-center font-semibold text-md'
								params={{ topicId: topicId.toString() }}
								to='/topics/{-$topicId}'
							>
								{displayText}
							</Link>
							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button
										className='absolute top-0 right-0 flex h-full w-8 items-center justify-center rounded-full border-0 bg-gradient-to-r from-0% from-transparent via-30% via-secondary to-50% to-secondary p-0 opacity-0 transition-opacity hover:to-secondary/80 group-hover:opacity-100 data-[state=open]:opacity-100'
										variant='ghost'
									>
										<MoreHorizontal className='h-3 w-3' />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='center'
									side='bottom'
									sideOffset={2}
								>
									{menuItems}
								</DropdownMenuContent>
							</DropdownMenu>
						</Badge>
					</TooltipTrigger>
					<TooltipContent className='max-w-72'>
						{name && (
							<h3 className='break-word font-semibold text-md [overflow-wrap:anywhere]'>
								{name}
							</h3>
						)}
						{name && notes && <br />}
						{notes && (
							<p className='break-word text-xs [overflow-wrap:anywhere]'>
								{notes}
							</p>
						)}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	)
}
