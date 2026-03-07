import { ReviewModeControl } from '~/app/components/ReviewModeControl'

interface ReviewModeFabProps {
	visible: boolean
}

export function ReviewModeFab({ visible }: ReviewModeFabProps) {
	if (!visible) return null

	return (
		<div className='pointer-events-none fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 sm:right-6'>
			<ReviewModeControl />
		</div>
	)
}
