type TopicDetailDisplayLevel = 1 | 2 | 3 | 4 | 5 | 6

export type TopicDetailSectionPresentation = {
	headingClassName: string
	sectionTopSpacingClassName: string
}

const TOPIC_DETAIL_ROOT_HEADER_BAND_CLASS_NAME =
	'bg-slate-50/88 dark:bg-slate-900/48'
const TOPIC_DETAIL_ROOT_TITLE_CLASS_NAME =
	'text-[1.95rem] font-semibold leading-[1.01] tracking-[-0.04em] text-slate-800 sm:text-[2.2rem] xl:text-[2.5rem] dark:text-slate-50'

const TOPIC_DETAIL_SECTION_PRESENTATION_BY_LEVEL: Record<
	TopicDetailDisplayLevel,
	TopicDetailSectionPresentation
> = {
	1: {
		headingClassName:
			'text-[1.68rem] font-semibold leading-[1.08] tracking-[-0.034em] text-slate-800 sm:text-[1.82rem] dark:text-slate-50',
		sectionTopSpacingClassName: 'pt-12'
	},
	2: {
		headingClassName:
			'text-[1.4rem] font-semibold leading-[1.13] tracking-[-0.028em] text-slate-800 sm:text-[1.5rem] dark:text-slate-50',
		sectionTopSpacingClassName: 'pt-10'
	},
	3: {
		headingClassName:
			'text-[1.15rem] font-semibold leading-[1.22] tracking-[-0.018em] text-slate-800 sm:text-[1.2rem] dark:text-slate-50',
		sectionTopSpacingClassName: 'pt-8'
	},
	4: {
		headingClassName:
			'text-[1rem] font-semibold leading-[1.32] tracking-[-0.01em] text-slate-700 dark:text-slate-100',
		sectionTopSpacingClassName: 'pt-6'
	},
	5: {
		headingClassName:
			'text-[0.92rem] font-semibold leading-[1.4] tracking-[0.012em] text-slate-600 dark:text-slate-300',
		sectionTopSpacingClassName: 'pt-4'
	},
	6: {
		headingClassName:
			'text-[0.84rem] font-semibold leading-[1.46] tracking-[0.02em] text-slate-500 dark:text-slate-400',
		sectionTopSpacingClassName: 'pt-3'
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
