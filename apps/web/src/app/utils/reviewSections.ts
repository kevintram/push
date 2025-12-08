import type {
	MergedSection,
	MergeOptions,
	ReviewSection,
	TopicSection
} from '~/app/types/reviewSections.types'

/**
 * Merges review sections and topic sections by matching their IDs.
 *
 * This function combines review and topic sections that share the same ID into
 * a single merged section. Sections are matched by their `id` property, and
 * when a match is found, the topic section data is merged into the review section.
 * If no match is found, the section is added as a standalone entry.
 *
 * @param reviewSections - Array of review sections to merge
 * @param topicSections - Array of topic sections to merge
 * @param options - Optional configuration for sorting and filtering
 * @param options.sectionOrder - Optional array of section IDs defining the desired sort order.
 *   Sections not in this array will be placed at the end.
 * @param options.filterEmpty - Optional function to filter out sections based on custom criteria
 *
 * @returns Array of merged sections, optionally sorted and filtered
 *
 * @example
 * ```tsx
 * const merged = mergeReviewSections(
 *   reviewSections,
 *   topicSections,
 *   {
 *     sectionOrder: ['overdue', 'today'],
 *     filterEmpty: (section) => {
 *       const reviewEntries = section.reviewsData?.entries ?? []
 *       const topicEntries = section.topicsData?.entries ?? []
 *       return reviewEntries.length > 0 || topicEntries.length > 0
 *     }
 *   }
 * )
 * ```
 */
export function mergeReviewSections(
	reviewSections: Array<ReviewSection>,
	topicSections: Array<TopicSection>,
	options: MergeOptions = {}
): Array<MergedSection> {
	const { sectionOrder, filterEmpty } = options

	const sectionMap = new Map<string, MergedSection>()

	// Add review sections
	for (const section of reviewSections) {
		sectionMap.set(section.id, {
			id: section.id,
			label: section.label,
			headingClassName: section.headingClassName,
			reviewsData: section
		})
	}

	// Add or merge topic sections
	for (const section of topicSections) {
		const existing = sectionMap.get(section.id)
		if (existing) {
			existing.topicsData = section
		} else {
			sectionMap.set(section.id, {
				id: section.id,
				label: section.label,
				headingClassName: section.headingClassName,
				topicsData: section
			})
		}
	}

	// Convert to array
	let merged = Array.from(sectionMap.values())

	// Sort by predefined order if provided
	if (sectionOrder) {
		merged = merged.sort((a, b) => {
			const aIndex = sectionOrder.indexOf(a.id)
			const bIndex = sectionOrder.indexOf(b.id)
			return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
		})
	}

	// Filter if filter function provided
	if (filterEmpty) {
		merged = merged.filter(filterEmpty)
	}

	return merged
}
