import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/** A toast title's text, with its bold names in `**`, as in `Moved **Ribosome**`. */
export function toastTitleText(title: ReactNode): string {
	const { container, unmount } = render(<>{title}</>)
	for (const strong of container.querySelectorAll('strong')) {
		strong.textContent = `**${strong.textContent}**`
	}
	const text = container.textContent ?? ''
	unmount()
	return text
}
