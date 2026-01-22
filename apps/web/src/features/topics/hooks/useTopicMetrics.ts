/**
 * Topic-specific re-export of the shared useLearnableMetrics hook.
 * Maintains backwards compatibility with existing imports.
 */
export {
	useLearnableMetrics as useTopicMetrics,
	type BucketInfo,
	type LearnableMetrics as TopicMetrics
} from '~/hooks/useLearnableMetrics'
