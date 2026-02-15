import { ReviewModeControl } from '~/app/components/ReviewModeControl'

interface FlashcardModeFabProps {
	visible: boolean
}

export function FlashcardModeFab({ visible }: FlashcardModeFabProps) {
	if (!visible) return null

	return (
		<div className='pointer-events-none fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 sm:right-6'>
			<ReviewModeControl />
		</div>
	)
}
