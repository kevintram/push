export type ReviewCardStatusBadgeKey =
	| 'due'
	| 'hazy_soon'
	| 'forgotten_soon'
	| 'hazy_for'
	| 'forgotten_for'

export type ReviewCardStatusBadgeTone =
	| 'danger'
	| 'info'
	| 'neutral'
	| 'warning'

export interface ReviewCardStatusBadge {
	key: ReviewCardStatusBadgeKey
	label: string
	tooltip: string | null
	tone: ReviewCardStatusBadgeTone
	reviewId: number | null
}
