/**
 * Source-specific re-export of the shared useLearnableMetrics hook.
 * Maintains backwards compatibility with existing imports.
 */
export {
	useLearnableMetrics as useSourceMetrics,
	type BucketInfo,
	type LearnableMetrics as SourceMetrics
} from '~/hooks/useLearnableMetrics'
