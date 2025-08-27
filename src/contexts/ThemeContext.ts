import { createContext } from 'react'
import type { Theme } from '~/providers/ThemeProvider'

type ThemeContextType = {
	theme: Theme
	setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
	undefined
)
