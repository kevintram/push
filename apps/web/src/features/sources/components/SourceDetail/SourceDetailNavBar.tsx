import type { ReactNode } from 'react'
import type { Source } from '../../types/source.types'
import { SourceParentsPanel } from '../SourceParentsPanel'

interface SourceDetailNavBarProps {
	source: Source
	/**
	 * Content to render in the left section before the parent panel (e.g., navigation buttons)
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

export function SourceDetailNavBar({
	source,
	headerBeforeActions,
	afterActions,
	onParentSelect
}: SourceDetailNavBarProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
					<SourceParentsPanel
						onParentSelect={onParentSelect}
						parent={source.parent}
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
