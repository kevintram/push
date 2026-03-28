import type { TopicDetailSectionNode } from './topicDetailStructure'

export const TOPIC_DETAIL_SECTION_GRID_CLASS =
	'grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'
export const TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS = 'max-w-[40rem]'
export const TOPIC_DETAIL_LEAF_CONTENT_RAIL_CLASS =
	'xl:mx-auto xl:w-full xl:max-w-[57.5rem]'
export const TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS = 'lg:w-96'
export const TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS =
	'lg:grid-cols-[minmax(0,1fr)_24rem]'
export const TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS =
	'border-border/70 border-y bg-muted/40'
export const TOPIC_DETAIL_OUTLINE_MIN_WIDTH = 224
export const TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH = 256
export const TOPIC_DETAIL_OUTLINE_MAX_WIDTH = 384

export type TopicDetailSectionPresentation = {
	displayLevel: number
	headingClassName: string
	headingIconClassName: string
	headingIndicatorFrameClassName: string
	sectionTopSpacingClassName: string
}

export function getTopicDetailSectionDisplayLevel(
	section: TopicDetailSectionNode
) {
	return Math.min(Math.max(section.headingLevel - 1, 1), 6)
}

export function getTopicDetailSectionPresentation(
	displayLevel: number
): TopicDetailSectionPresentation {
	if (displayLevel === 1) {
		return {
			displayLevel,
			headingClassName:
				'text-[1.625rem] font-semibold leading-[1.14] tracking-[-0.022em] sm:text-[1.75rem]',
			headingIconClassName: 'h-[1.125rem] w-[1.125rem]',
			headingIndicatorFrameClassName: 'top-0.5 h-7 w-7',
			sectionTopSpacingClassName: 'pt-12'
		}
	}

	if (displayLevel === 2) {
		return {
			displayLevel,
			headingClassName:
				'text-[1.375rem] font-semibold leading-[1.18] tracking-[-0.018em] sm:text-[1.5rem]',
			headingIconClassName: 'h-[1.125rem] w-[1.125rem]',
			headingIndicatorFrameClassName: 'top-0.5 h-7 w-7',
			sectionTopSpacingClassName: 'pt-10'
		}
	}

	if (displayLevel === 3) {
		return {
			displayLevel,
			headingClassName:
				'text-[1.125rem] font-semibold leading-[1.24] tracking-[-0.012em] sm:text-[1.1875rem]',
			headingIconClassName: 'h-4 w-4',
			headingIndicatorFrameClassName: 'top-0 h-6 w-6',
			sectionTopSpacingClassName: 'pt-8'
		}
	}

	if (displayLevel === 4) {
		return {
			displayLevel,
			headingClassName:
				'text-base font-semibold leading-[1.3] tracking-[-0.008em] sm:text-[1.0625rem]',
			headingIconClassName: 'h-[0.9375rem] w-[0.9375rem]',
			headingIndicatorFrameClassName: 'top-0 h-5 w-5',
			sectionTopSpacingClassName: 'pt-6'
		}
	}

	if (displayLevel === 5) {
		return {
			displayLevel,
			headingClassName:
				'text-[0.9375rem] font-semibold leading-[1.34] tracking-[0.008em] text-foreground/90',
			headingIconClassName: 'h-[0.875rem] w-[0.875rem]',
			headingIndicatorFrameClassName: 'top-0 h-5 w-5',
			sectionTopSpacingClassName: 'pt-4'
		}
	}

	return {
		displayLevel,
		headingClassName:
			'text-[0.875rem] font-semibold leading-[1.4] tracking-[0.012em] text-muted-foreground',
		headingIconClassName: 'h-[0.8125rem] w-[0.8125rem]',
		headingIndicatorFrameClassName: 'top-0 h-5 w-5',
		sectionTopSpacingClassName: 'pt-3'
	}
}
