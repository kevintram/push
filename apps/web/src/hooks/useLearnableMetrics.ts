import { useMemo } from 'react'
import type { LearnableMetricsInput } from '~/models/learnable.types'
import {
	formatRetrievability,
	getFreshnessTierColor
} from '~/utils/retrievability'

export interface FreshnessTierInfo {
	label: 'Fresh' | 'Fine' | 'Hazy' | 'Forgotten' | '—'
	tooltip: string | null
}

export interface LearnableMetrics {
	freshnessTierInfo: FreshnessTierInfo
	freshnessTierColor: string
	retrievabilityDisplay: string | null
	stabilityText: string
	stabilityTooltipText: string
	isUnreviewed: boolean
	isLeavingSoon: boolean
	leavingSoonLabel: string | null
	leavingSoonTooltip: string | null
	daysUntilNextTier: number | null
}

export function useLearnableMetrics(
	learnable: LearnableMetricsInput | null
): LearnableMetrics {
	const retrievability = learnable?.retrievability ?? null
	const freshnessTier = learnable?.freshness_tier ?? null
	const daysUntilNextTier = learnable?.days_until_next_tier ?? null
	const stability = learnable?.stability ?? null
	const lastReviewedAt = learnable?.last_reviewed_at ?? null
	const inheritedStability = learnable?.inherited_stability ?? null
	const srsEnabled = learnable?.srs_enabled ?? true

	const retrievabilityDisplay = useMemo(() => {
		if (retrievability === null) return null
		return formatRetrievability(retrievability)
	}, [retrievability])

	const freshnessTierInfo = useMemo((): FreshnessTierInfo => {
		if (freshnessTier === null) {
			return { label: '—', tooltip: null }
		}

		const tooltip =
			retrievabilityDisplay !== null
				? `Retrievability: ${retrievabilityDisplay}`
				: 'Complete a review to calculate retrievability.'

		return { label: freshnessTier, tooltip }
	}, [freshnessTier, retrievabilityDisplay])

	const leavingSoonLabel = useMemo(() => {
		if (freshnessTier === 'Fine') return 'Hazy soon'
		if (freshnessTier === 'Hazy') return 'Forgotten soon'
		return null
	}, [freshnessTier])

	const leavingSoonTooltip = useMemo(() => {
		if (daysUntilNextTier === null || leavingSoonLabel === null) return null
		const nextTier = freshnessTier === 'Fine' ? 'Hazy' : 'Forgotten'
		const days = Math.max(0, daysUntilNextTier)
		return `${days} ${days === 1 ? 'day' : 'days'} until ${nextTier}`
	}, [daysUntilNextTier, leavingSoonLabel, freshnessTier])

	const stabilityText = useMemo(() => {
		if (stability === null) return '—'
		return `${Math.round(stability)}d`
	}, [stability])

	const stabilityTooltipText = useMemo(() => {
		if (stability === null) return '—'
		const days = Math.round(stability)
		return `${days} ${days === 1 ? 'day' : 'days'}`
	}, [stability])

	const isUnreviewed = useMemo(() => {
		return (
			retrievability === null &&
			lastReviewedAt === null &&
			inheritedStability === null
		)
	}, [retrievability, lastReviewedAt, inheritedStability])

	const isLeavingSoon = useMemo(() => {
		if (daysUntilNextTier === null) return false
		if (freshnessTier !== 'Fine' && freshnessTier !== 'Hazy') return false
		return daysUntilNextTier >= 0 && daysUntilNextTier <= 4
	}, [daysUntilNextTier, freshnessTier])

	const freshnessTierColor = useMemo(
		() => getFreshnessTierColor(freshnessTier, srsEnabled),
		[freshnessTier, srsEnabled]
	)

	return {
		freshnessTierInfo,
		freshnessTierColor,
		retrievabilityDisplay,
		stabilityText,
		stabilityTooltipText,
		isUnreviewed,
		isLeavingSoon,
		leavingSoonLabel,
		leavingSoonTooltip,
		daysUntilNextTier
	}
}
