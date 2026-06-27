import { useCallback, useState } from 'react'

/**
 * Hook for managing the collapsed/expanded state of multiple sections.
 *
 * Each section is identified by a unique string ID. The hook tracks which sections
 * are collapsed (true) or expanded (false).
 *
 * @returns An object containing:
 *   - `collapsedSections`: A record mapping section IDs to their collapsed state
 *   - `toggleSection`: A function to toggle the collapsed state of a section by ID
 *
 * @example
 * ```tsx
 * const { collapsedSections, toggleSection } = useSectionCollapse()
 *
 * // Toggle a section
 * toggleSection('overdue')
 *
 * // Check if a section is collapsed
 * const isCollapsed = collapsedSections['overdue'] ?? false
 * ```
 */
export function useSectionCollapse() {
	const [collapsedSections, setCollapsedSections] = useState<
		Record<string, boolean>
	>({})

	const expandSection = useCallback((sectionId: string) => {
		setCollapsedSections(prev => {
			if (prev[sectionId] === false || prev[sectionId] == null) {
				return prev
			}

			return {
				...prev,
				[sectionId]: false,
			}
		})
	}, [])

	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}))
	}, [])

	return {
		collapsedSections,
		expandSection,
		toggleSection,
	}
}
