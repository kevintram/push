type TopicDetailDisplayLevel = 1 | 2 | 3 | 4 | 5 | 6

export type TopicDetailSectionPresentation = {
	contentTopSpacingClassName: string
	headingClassName: string
	sectionTopSpacingClassName: string
}

const TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS_NAME =
	'bg-slate-50/88 dark:bg-slate-900/48'
const TOPIC_DETAIL_ROOT_TITLE_CLASS_NAME =
	'text-[2rem] leading-[2.5rem] font-bold tracking-[-0.02em] text-slate-800 md:text-[2rem] md:leading-[2.5rem] dark:text-slate-50'

const TOPIC_DETAIL_SECTION_PRESENTATION_BY_LEVEL: Record<
	TopicDetailDisplayLevel,
	TopicDetailSectionPresentation
> = {
	1: {
		headingClassName:
			'text-[1.3125rem] leading-[1.75rem] font-bold tracking-normal text-slate-800 dark:text-slate-50',
		contentTopSpacingClassName: 'pt-2',
		sectionTopSpacingClassName: 'pt-9'
	},
	2: {
		headingClassName:
			'text-[1rem] leading-[1.5rem] font-semibold tracking-normal text-slate-800 dark:text-slate-50',
		contentTopSpacingClassName: 'pt-2',
		sectionTopSpacingClassName: 'pt-7'
	},
	3: {
		headingClassName:
			'text-[0.875rem] leading-[1.25rem] font-bold tracking-normal text-slate-800 dark:text-slate-50',
		contentTopSpacingClassName: 'pt-[0.375rem]',
		sectionTopSpacingClassName: 'pt-[1.375rem]'
	},
	4: {
		headingClassName:
			'text-[0.875rem] leading-[1.25rem] font-medium tracking-normal text-slate-700 dark:text-slate-100',
		contentTopSpacingClassName: 'pt-[0.375rem]',
		sectionTopSpacingClassName: 'pt-[1.125rem]'
	},
	5: {
		headingClassName:
			'text-[0.8125rem] leading-[1.125rem] font-medium tracking-normal text-slate-600 dark:text-slate-300',
		contentTopSpacingClassName: 'pt-1',
		sectionTopSpacingClassName: 'pt-[0.875rem]'
	},
	6: {
		headingClassName:
			'text-[0.75rem] leading-[1.0625rem] font-medium tracking-normal text-slate-500 dark:text-slate-400',
		contentTopSpacingClassName: 'pt-1',
		sectionTopSpacingClassName: 'pt-[0.875rem]'
	}
}

export function getTopicDetailIndicatorLayout() {
	return {
		indicatorGap: '0rem',
		indicatorWidth: '0rem'
	}
}

export function getTopicDetailRootPresentation() {
	return {
		rootHeaderBandClassName: TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS_NAME,
		rootTitleClassName: TOPIC_DETAIL_ROOT_TITLE_CLASS_NAME
	}
}

export function getTopicDetailSectionPresentation(
	displayLevel: number
): TopicDetailSectionPresentation {
	const clamped = Math.min(
		Math.max(displayLevel, 1),
		6
	) as TopicDetailDisplayLevel
	const levelPresentation = TOPIC_DETAIL_SECTION_PRESENTATION_BY_LEVEL[clamped]

	return levelPresentation
}
