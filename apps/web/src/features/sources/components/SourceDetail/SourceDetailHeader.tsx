import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '~/components/ui/Tooltip'
import type { Source } from '../../types/source.types'
import { SourceParentsPanel } from '../SourceParentsPanel'

interface SourceDetailHeaderProps {
	source: Source
	/**
	 * Content to render in the left section before the parent indicator (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	/**
	 * Callback when parent is selected. If not provided, uses default dialog behavior.
	 */
	onParentSelect?: (sourceId: number) => void
}

export function SourceDetailHeader({
	source,
	headerBeforeActions,
	afterActions,
	onParentSelect
}: SourceDetailHeaderProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
					<div className='flex items-center gap-2'>
						{/* Type indicator */}
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div className='flex items-center gap-1 text-muted-foreground text-xs'>
									<FileText className='h-3 w-3' />
									<span>Source</span>
								</div>
							</TooltipTrigger>
							<TooltipContent side='bottom'>This is a Source</TooltipContent>
						</Tooltip>
					</div>
					<SourceParentsPanel
						onParentSelect={onParentSelect}
						parent={source.parent}
						parentId={source.parent_id}
						sourceId={source.id}
					/>
				</div>

				{afterActions && (
					<div className='flex items-center gap-2'>{afterActions}</div>
				)}
			</div>
		</div>
	)
}
