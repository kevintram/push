import { useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'

type PracticeDetailTab = 'home' | 'reviews'

interface PracticeDetailNavBarProps {
	practiceId?: number
	/**
	 * Content to render in the left section (e.g., navigation buttons)
	 */
	headerBeforeActions?: ReactNode
	/**
	 * Content to render on the right side (e.g., close/minimize buttons)
	 */
	afterActions?: ReactNode
	activeTab?: PracticeDetailTab
}

export function PracticeDetailNavBar({
	practiceId,
	headerBeforeActions,
	afterActions,
	activeTab = 'home'
}: PracticeDetailNavBarProps) {
	const navigate = useNavigate()
	const params = useParams({ strict: false })
	const routePracticeId =
		typeof params.practiceId === 'string'
			? Number.parseInt(params.practiceId, 10)
			: Number.NaN
	const resolvedPracticeId = practiceId ?? routePracticeId

	const handleTabChange = useCallback(
		(value: string) => {
			if (value === activeTab) return
			if (!Number.isFinite(resolvedPracticeId)) return

			if (value === 'reviews') {
				navigate({
					to: '/practices/$practiceId/reviews',
					params: { practiceId: resolvedPracticeId.toString() }
				})
				return
			}

			navigate({
				to: '/practices/$practiceId',
				params: { practiceId: resolvedPracticeId.toString() }
			})
		},
		[activeTab, navigate, resolvedPracticeId]
	)

	return (
		<div className='sticky top-0 z-10 w-full border-b'>
			<div className='flex items-center justify-between gap-4 px-2 py-1'>
				<div className='flex min-w-0 flex-1 items-center gap-4'>
					{headerBeforeActions}
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
