import { useMemo } from 'react'
import type { RetrievabilityBucket } from '~/utils/retrievability'
import {
	calculateDaysSinceLate,
	formatRetrievability,
	getRetrievabilityBucket,
	getThresholdCrossingInfo
} from '~/utils/retrievability'

interface TopicMetricsInput {
	retrievability: number | null
	stability: number | null
	last_reviewed_at: string | null
	inherited_stability: number | null
}

export interface BucketInfo {
	label: 'Early' | 'Ready' | 'Late' | '—'
	days: number | null
	suffix: 'left' | 'ago' | null
	tooltip: string | null
}

export interface TopicMetrics {
	bucketInfo: BucketInfo
	thresholdInfo: { daysUntil: number; nextBucket: RetrievabilityBucket } | null
	retrievabilityDisplay: string | null
	stabilityText: string
	stabilityTooltipText: string
	isNewTopic: boolean
	isLeavingSoon: boolean
}

export function useTopicMetrics(topic: TopicMetricsInput | null): TopicMetrics {
	const retrievability = topic?.retrievability ?? null
	const stability = topic?.stability ?? null
	const lastReviewedAt = topic?.last_reviewed_at ?? null
	const inheritedStability = topic?.inherited_stability ?? null

	const thresholdInfo = useMemo(
		() => getThresholdCrossingInfo(retrievability, stability, lastReviewedAt),
		[retrievability, stability, lastReviewedAt]
	)

	const bucketInfo = useMemo((): BucketInfo => {
		if (retrievability === null) {
			return { label: '—', days: null, suffix: null, tooltip: null }
		}

		const bucket = getRetrievabilityBucket(retrievability)

		switch (bucket) {
			case 'early': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Early',
					days,
					suffix: 'left',
					tooltip: `A little early to review, ${days} days until ready`
				}
			}
			case 'onTime': {
				const days = thresholdInfo?.daysUntil ?? 0
				return {
					label: 'Ready',
					days,
					suffix: 'left',
					tooltip: `Ready to review, ${days} days until late`
				}
			}
			case 'late': {
				const days = calculateDaysSinceLate(stability, lastReviewedAt)
				return {
					label: 'Late',
					days,
					suffix: 'ago',
					tooltip: `${days} days late, ready for a risky review`
				}
			}
			default:
				return bucket satisfies never
		}
	}, [retrievability, stability, lastReviewedAt, thresholdInfo])

	const retrievabilityDisplay = useMemo(() => {
		if (retrievability === null) return null
		return formatRetrievability(retrievability)
	}, [retrievability])

	const stabilityText = useMemo(() => {
		if (stability === null) return '—'
		return `${Math.round(stability)}d`
	}, [stability])

	const stabilityTooltipText = useMemo(() => {
		if (stability === null) return '—'
		const days = Math.round(stability)
		return `${days} ${days === 1 ? 'day' : 'days'}`
	}, [stability])

	const isNewTopic = useMemo(() => {
		return (
			retrievability === null &&
			lastReviewedAt === null &&
			inheritedStability === null
		)
	}, [retrievability, lastReviewedAt, inheritedStability])

	const isLeavingSoon = useMemo(() => {
		return thresholdInfo !== null && thresholdInfo.daysUntil <= 7
	}, [thresholdInfo])

	return {
		bucketInfo,
		thresholdInfo,
		retrievabilityDisplay,
		stabilityText,
		stabilityTooltipText,
		isNewTopic,
		isLeavingSoon
	}
}
