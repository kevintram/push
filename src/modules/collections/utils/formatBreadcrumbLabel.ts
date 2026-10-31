// formatBreadcrumbLabel shows a blank title as "Untitled" in breadcrumb trails.
export function formatBreadcrumbLabel(value: string) {
	return value.trim() || 'Untitled'
}
