export const REVIEW_LIST_GRID_COLS =
	'grid-cols-[3rem_1fr_5.5rem_minmax(0,12rem)_5.5rem_2rem]'

export function ReviewListHeader() {
	return (
		<div
			className={`@lg/review-list:grid hidden ${REVIEW_LIST_GRID_COLS} items-center gap-x-3 px-2 pb-1.5 text-muted-foreground text-xs`}
		>
			<span>Rating</span>
			<span>Description</span>
			<span>Durability</span>
			<span>Entity</span>
			<span>Date</span>
			<span />
		</div>
	)
}
