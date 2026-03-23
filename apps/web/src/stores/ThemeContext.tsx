import {
	ThemeProvider as NextThemesProvider,
	useTheme as useNextTheme
} from 'next-themes'
import type { ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'system'
export type ResolvedTheme = Exclude<Theme, 'system'>

type ThemeProviderProps = {
	children: ReactNode
	defaultTheme?: Theme
	storageKey?: string
}

type UseThemeResult = {
	theme?: Theme
	resolvedTheme?: ResolvedTheme
	setTheme: (theme: Theme) => void
	systemTheme?: ResolvedTheme
	themes: Array<string>
}

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'vite-ui-theme'
}: ThemeProviderProps) {
	return (
		<NextThemesProvider
			attribute='class'
			defaultTheme={defaultTheme}
			enableSystem={true}
			storageKey={storageKey}
		>
			{children}
		</NextThemesProvider>
	)
}

export function useTheme(): UseThemeResult {
	const theme = useNextTheme()

	return {
		theme: theme.theme as Theme | undefined,
		resolvedTheme: theme.resolvedTheme as ResolvedTheme | undefined,
		setTheme: theme.setTheme as (theme: Theme) => void,
		systemTheme: theme.systemTheme as ResolvedTheme | undefined,
		themes: theme.themes
	}
}
