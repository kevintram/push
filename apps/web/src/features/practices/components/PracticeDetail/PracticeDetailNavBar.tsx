import type { ReactNode } from 'react'

interface PracticeDetailNavBarProps {
	/**
	 * Content to render in the left section (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
}

export function PracticeDetailNavBar({
	headerBeforeActions,
	afterActions
}: PracticeDetailNavBarProps) {
	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
				</div>

				{afterActions && (
					<div className='flex items-center gap-2'>{afterActions}</div>
				)}
			</div>
		</div>
	)
}
