import type { Practice } from '~/features/practices/types/practice.types'
import type { Source } from '~/features/sources/types/source.types'
import type { Topic } from '~/features/topics/types/topic.types'

export type ConversionPreview = {
	migrated: Array<{ label: string; count: number }>
	lost: Array<string>
	blockers: Array<string>
}

function hasSubtreeCoveringSources(topic: Topic): boolean {
	if ((topic.sources_count ?? 0) > 0) return true
	if (topic.children) {
		for (const child of topic.children) {
			if (hasSubtreeCoveringSources(child)) return true
		}
	}
	return false
}

export function getTopicToSourcePreview(
	topic: Topic,
	options?: {
		childTopics?: Array<Topic>
	}
): ConversionPreview {
	const childrenCount = topic.children_count ?? 0
	const relationsCount =
		(topic.related_outgoing_count ?? 0) + (topic.related_incoming_count ?? 0)
	const childTopics = options?.childTopics ?? topic.children

	const migrated: ConversionPreview['migrated'] = []
	if (childrenCount > 0)
		migrated.push({ label: 'Children', count: childrenCount })
	if (relationsCount > 0)
		migrated.push({ label: 'Entity relations', count: relationsCount })

	const blockers: Array<string> = []
	if (
		(topic.sources_count ?? 0) > 0 ||
		(childTopics ?? []).some(child => hasSubtreeCoveringSources(child))
	)
		blockers.push('Topic or its children have covering sources')

	return { migrated, lost: [], blockers }
}

export function getTopicToPracticePreview(topic: Topic): ConversionPreview {
	const childrenCount = topic.children_count ?? 0
	const sourcesCount = topic.sources_count ?? 0
	const practicesCount = topic.practices_count ?? 0
	const relationsCount =
		(topic.related_outgoing_count ?? 0) + (topic.related_incoming_count ?? 0)

	const migrated: ConversionPreview['migrated'] = []
	if (relationsCount > 0)
		migrated.push({
			label: 'Entity relations → linked topics',
			count: relationsCount
		})

	const blockers: Array<string> = []
	if (childrenCount > 0) blockers.push('Topic has children')
	if (sourcesCount > 0) blockers.push('Topic has covering sources')
	if (practicesCount > 0) blockers.push('Topic has linked practices')

	return { migrated, lost: [], blockers }
}

export function getSourceToTopicPreview(source: Source): ConversionPreview {
	const childrenCount = source.children_count ?? 0
	const topicsCount = source.topics_count ?? 0
	const prerequisitesCount = source.prerequisites_count ?? 0
	const practicesCount = source.practices_count ?? 0
	const relationsCount =
		(source.related_outgoing_count ?? 0) + (source.related_incoming_count ?? 0)

	const migrated: ConversionPreview['migrated'] = []
	if (childrenCount > 0)
		migrated.push({ label: 'Children', count: childrenCount })
	if (topicsCount > 0)
		migrated.push({
			label: 'Covering topics \u2192 entity relations',
			count: topicsCount
		})
	if (prerequisitesCount > 0)
		migrated.push({
			label: 'Prerequisites \u2192 entity relations',
			count: prerequisitesCount
		})
	if (practicesCount > 0)
		migrated.push({ label: 'Linked practices', count: practicesCount })
	if (relationsCount > 0)
		migrated.push({ label: 'Entity relations', count: relationsCount })

	return { migrated, lost: [], blockers: [] }
}

export function getSourceToPracticePreview(source: Source): ConversionPreview {
	const childrenCount = source.children_count ?? 0
	const topicsCount = source.topics_count ?? 0
	const relationsCount =
		(source.related_outgoing_count ?? 0) + (source.related_incoming_count ?? 0)
	const prerequisitesCount = source.prerequisites_count ?? 0

	const migrated: ConversionPreview['migrated'] = []
	if (topicsCount > 0)
		migrated.push({
			label: 'Covering topics \u2192 practice topics',
			count: topicsCount
		})

	const lost: Array<string> = []
	if (relationsCount > 0) lost.push('Entity relations')
	if (prerequisitesCount > 0) lost.push('Prerequisites')

	const blockers: Array<string> = []
	if (childrenCount > 0) blockers.push('Source has children')

	return { migrated, lost, blockers }
}

export function getPracticeToTopicPreview(
	practice: Practice
): ConversionPreview {
	const sourcesCount = practice.sources_count ?? 0
	const topicsCount = practice.topics_count ?? 0

	const migrated: ConversionPreview['migrated'] = []
	if (sourcesCount > 0)
		migrated.push({
			label: 'Linked sources \u2192 source topics',
			count: sourcesCount
		})
	if (topicsCount > 0)
		migrated.push({
			label: 'Linked topics \u2192 entity relations',
			count: topicsCount
		})

	return { migrated, lost: [], blockers: [] }
}

export function getPracticeToSourcePreview(
	practice: Practice
): ConversionPreview {
	const topicsCount = practice.topics_count ?? 0
	const sourcesCount = practice.sources_count ?? 0

	const migrated: ConversionPreview['migrated'] = []
	if (topicsCount > 0)
		migrated.push({
			label: 'Linked topics \u2192 source topics',
			count: topicsCount
		})
	if (sourcesCount > 0)
		migrated.push({
			label: 'Linked sources \u2192 entity relations',
			count: sourcesCount
		})

	return { migrated, lost: [], blockers: [] }
}
