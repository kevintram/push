import * as v from 'valibot'

export const ReviewCardStatusBadgeKeySchema = v.picklist([
	'due',
	'hazy_soon',
	'forgotten_soon',
	'hazy_for',
	'forgotten_for'
])

export const ReviewCardStatusBadgeToneSchema = v.picklist([
	'danger',
	'info',
	'neutral',
	'warning'
])

export const ReviewCardStatusBadgeSchema = v.object({
	key: ReviewCardStatusBadgeKeySchema,
	label: v.string(),
	tooltip: v.nullable(v.string()),
	tone: ReviewCardStatusBadgeToneSchema,
	review_id: v.nullable(v.number())
})
