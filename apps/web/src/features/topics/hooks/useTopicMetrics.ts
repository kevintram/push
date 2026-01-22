/**
 * Topic-specific re-export of the shared useLearnableMetrics hook.
 * Maintains backwards compatibility with existing imports.
 */
export {
	type BucketInfo,
	type LearnableMetrics as TopicMetrics,
	useLearnableMetrics as useTopicMetrics
} from '~/hooks/useLearnableMetrics'
