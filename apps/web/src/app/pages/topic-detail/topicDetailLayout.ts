import {
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Heading5,
	Heading6,
	type LucideIcon
} from 'lucide-react'
import type { TopicDetailSectionNode } from './topicDetailStructure'

export const TOPIC_DETAIL_SECTION_GRID_CLASS =
	'grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5'
export const TOPIC_DETAIL_ROOT_CONTENT_MEASURE_CLASS = 'max-w-[40rem]'
export const TOPIC_DETAIL_LEAF_CONTENT_MEASURE_CLASS = 'lg:max-w-[40rem]'
export const TOPIC_DETAIL_OUTLINE_GUTTER_WIDTH_CLASS =
	'lg:w-(--topic-detail-outline-width)'
export const TOPIC_DETAIL_PAGE_WITH_OUTLINE_GRID_CLASS =
	'lg:grid-cols-[minmax(0,1fr)_var(--topic-detail-outline-width)]'
export const TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS =
	'border-border/70 border-y bg-muted/40'
export const TOPIC_DETAIL_OUTLINE_MIN_WIDTH = 224
export const TOPIC_DETAIL_OUTLINE_DEFAULT_WIDTH = 256
export const TOPIC_DETAIL_OUTLINE_MAX_WIDTH = 384

export type TopicDetailSectionPresentation = {
	displayLevel: number
	headingClassName: string
	sectionTopSpacingClassName: string
}

export const TOPIC_DETAIL_HEADING_INDICATOR_OFFSET_CLASS = 'mt-0.5'

const HEADING_ICON_BY_LEVEL: Record<number, LucideIcon> = {
	1: Heading1,
	2: Heading2,
	3: Heading3,
	4: Heading4,
	5: Heading5,
	6: Heading6
}

export type TopicDetailHeadingIndicatorPresentation = {
	HeadingIcon: LucideIcon
	headingIconClassName: string
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
			sectionTopSpacingClassName: 'pt-12'
		}
	}

	if (displayLevel === 2) {
		return {
			displayLevel,
			headingClassName:
				'text-[1.375rem] font-semibold leading-[1.18] tracking-[-0.018em] sm:text-[1.5rem]',
			sectionTopSpacingClassName: 'pt-10'
		}
	}

	if (displayLevel === 3) {
		return {
			displayLevel,
			headingClassName:
				'text-[1.125rem] font-semibold leading-[1.24] tracking-[-0.012em] sm:text-[1.1875rem]',
			sectionTopSpacingClassName: 'pt-8'
		}
	}

	if (displayLevel === 4) {
		return {
			displayLevel,
			headingClassName:
				'text-base font-semibold leading-[1.3] tracking-[-0.008em] sm:text-[1.0625rem]',
			sectionTopSpacingClassName: 'pt-6'
		}
	}

	if (displayLevel === 5) {
		return {
			displayLevel,
			headingClassName:
				'text-[0.9375rem] font-semibold leading-[1.34] tracking-[0.008em] text-foreground/90',
			sectionTopSpacingClassName: 'pt-4'
		}
	}

	return {
		displayLevel,
		headingClassName:
			'text-[0.875rem] font-semibold leading-[1.4] tracking-[0.012em] text-muted-foreground',
		sectionTopSpacingClassName: 'pt-3'
	}
}

export function getTopicDetailHeadingIndicatorPresentation(
	headingLevel: number
): TopicDetailHeadingIndicatorPresentation {
	const clamped = Math.min(Math.max(headingLevel, 1), 6)
	const HeadingIcon = HEADING_ICON_BY_LEVEL[clamped] ?? Heading1

	if (clamped === 1) {
		return { HeadingIcon, headingIconClassName: 'h-[1.375rem] w-[1.375rem]' }
	}

	if (clamped === 2) {
		return { HeadingIcon, headingIconClassName: 'h-5 w-5' }
	}

	if (clamped <= 4) {
		return { HeadingIcon, headingIconClassName: 'h-[1.125rem] w-[1.125rem]' }
	}

	if (clamped === 5) {
		return { HeadingIcon, headingIconClassName: 'h-[1.0625rem] w-[1.0625rem]' }
	}

	return { HeadingIcon, headingIconClassName: 'h-[0.9375rem] w-[0.9375rem]' }
}
