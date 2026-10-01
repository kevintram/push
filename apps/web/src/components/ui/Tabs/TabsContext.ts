import { createContext, use } from 'react'

export type TabsVariant = 'default' | 'line'

export const TabsVariantContext = createContext<TabsVariant>('default')

export function useTabsVariant() {
	return use(TabsVariantContext)
}
