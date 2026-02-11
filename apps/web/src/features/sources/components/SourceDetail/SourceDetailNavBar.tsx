import { useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import type { Source } from '../../types/source.types'
import { SourceParentsPanel } from '../SourceParentsPanel'

type SourceDetailTab = 'home' | 'reviews'

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
	activeTab?: SourceDetailTab
}

export function SourceDetailNavBar({
	source,
	headerBeforeActions,
	afterActions,
	onParentSelect,
	activeTab = 'home'
}: SourceDetailNavBarProps) {
	const navigate = useNavigate()

	const handleTabChange = useCallback(
		(value: string) => {
			if (value === activeTab) return

			if (value === 'reviews') {
				navigate({
					to: '/sources/$sourceId/reviews',
					params: { sourceId: source.id.toString() }
				})
				return
			}

			navigate({
				to: '/sources/$sourceId',
				params: { sourceId: source.id.toString() }
			})
		},
		[activeTab, navigate, source.id]
	)

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

				<div className='flex items-center gap-2'>
					<Tabs onValueChange={handleTabChange} value={activeTab}>
						<TabsList className='h-8'>
							<TabsTrigger value='home'>Home</TabsTrigger>
							<TabsTrigger value='reviews'>Reviews</TabsTrigger>
						</TabsList>
					</Tabs>
					{afterActions && (
						<div className='flex items-center gap-2'>{afterActions}</div>
					)}
				</div>
			</div>
		</div>
	)
}
