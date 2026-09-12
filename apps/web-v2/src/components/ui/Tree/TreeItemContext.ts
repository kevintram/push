import { createContext, use } from 'react'

type TreeItemContextValue = {
	collapsible: boolean
	label: string
	selected: boolean
}

export const TreeItemContext = createContext<TreeItemContextValue | null>(null)

export function useTreeItemContext() {
	const context = use(TreeItemContext)

	if (!context) {
		throw new Error('Tree item components must be used within TreeItem')
	}

	return context
}
