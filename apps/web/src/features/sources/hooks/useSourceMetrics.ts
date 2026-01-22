/**
 * Source-specific re-export of the shared useLearnableMetrics hook.
 * Maintains backwards compatibility with existing imports.
 */
export {
	type BucketInfo,
	type LearnableMetrics as SourceMetrics,
	useLearnableMetrics as useSourceMetrics
} from '~/hooks/useLearnableMetrics'
