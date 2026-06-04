export function getReviewListGridCols(showCardColumn: boolean) {
	return showCardColumn
		? 'grid-cols-[3rem_minmax(0,12rem)_1fr_5.5rem_5.5rem_2rem]'
		: 'grid-cols-[3rem_1fr_5.5rem_5.5rem_2rem]'
}

interface ReviewListHeaderProps {
	showCardColumn?: boolean
}

export function ReviewListHeader({
	showCardColumn = true
}: ReviewListHeaderProps) {
	const gridCols = getReviewListGridCols(showCardColumn)

	return (
		<div
			className={`@lg/review-list:grid hidden ${gridCols} items-center gap-x-3 px-2 pb-1.5 text-muted-foreground text-xs`}
		>
			<span>Rating</span>
			{showCardColumn && <span>Card</span>}
			<span>Description</span>
			<span>Date</span>
			<span>Durability</span>
			<span />
		</div>
	)
}
