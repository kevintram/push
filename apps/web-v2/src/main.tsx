import './styles/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'

if (import.meta.env.DEV && !import.meta.env.VITEST) {
	const branchLabel = __APP_BRANCH__
	if (branchLabel.length > 0 && !document.title.includes(branchLabel)) {
		document.title = `${document.title} ${branchLabel}`.trim()
	}
}
const container = document.querySelector('#root')

if (container) {
	createRoot(container).render(
		<StrictMode>
			<App />
		</StrictMode>,
	)
}
