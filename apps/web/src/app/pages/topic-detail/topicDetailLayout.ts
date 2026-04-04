export const TOPIC_DETAIL_SECTION_GRID_CLASS =
	'grid grid-cols-[var(--topic-detail-indicator-width,2.25rem)_minmax(0,1fr)] gap-x-[var(--topic-detail-indicator-gap,0.375rem)]'
export const TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS = 'max-w-[40rem]'
export const TOPIC_DETAIL_LEAF_CONTENT_MEASURE_CLASS = 'lg:max-w-[40rem]'
export const TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS =
	'lg:w-(--topic-detail-outline-width)'
export const TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS =
	'lg:grid-cols-[minmax(0,1fr)_var(--topic-detail-outline-width)]'
export const TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS = 'border-border/70 border-y'
export const TOPIC_DETAIL_OUTLINE_MIN_WIDTH = 224
export const TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH = 256
export const TOPIC_DETAIL_OUTLINE_MAX_WIDTH = 384

export function getTopicDetailSectionDisplayLevel(section: {
	headingLevel: number
}) {
	return Math.min(Math.max(section.headingLevel - 1, 1), 6)
}
