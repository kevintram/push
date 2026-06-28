import { CountBadge } from '~/components/ui/count-badge'
import { type ReviewCardQueueItem } from '~/modules/review-cards/types/review-card.types'

import { ReviewCardMasonry } from './ReviewCardMasonry'

type ReviewCardSection = {
	id: string
	items: Array<ReviewCardQueueItem>
	label: string
	subLabel?: string
	headingClassName?: string
}

type ReviewCardSectionListProps = {
	onCardClick: (cardId: number) => void
	sections: Array<ReviewCardSection>
}

export function ReviewCardSectionList({
	onCardClick,
	sections,
}: ReviewCardSectionListProps) {
	return (
		<div className='space-y-6'>
			{sections.map(section => (
				<section className='space-y-3' key={section.id}>
					<div>
						<h3
							className={`flex items-center gap-2 font-bold text-xl ${section.headingClassName ?? ''}`}
						>
							{section.label}
							<CountBadge count={section.items.length} />
						</h3>
						{section.subLabel ? (
							<p className='text-muted-foreground text-sm'>
								{section.subLabel}
							</p>
						) : null}
					</div>
					<ReviewCardMasonry
						items={section.items}
						onCardClick={onCardClick}
					/>
				</section>
			))}
		</div>
	)
}
