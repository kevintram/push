/**
 * Topic-specific re-export of the shared useLearnableMetrics hook.
 * Maintains backwards compatibility with existing imports.
 */
export {
	type FreshnessTierInfo,
	type LearnableMetrics as TopicMetrics,
	useLearnableMetrics as useTopicMetrics
} from '~/hooks/useLearnableMetrics'
