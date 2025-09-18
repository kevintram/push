import { useEffect, useRef } from 'react'

/**
 * A hook that automatically resizes a textarea based on its content.
 * @param content - The content value that triggers resize when changed
 * @returns A ref to attach to the textarea element
 */
export function useAutoResizeTextarea(content: string) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Auto-resize textarea based on content
	useEffect(() => {
		const textarea = textareaRef.current
		if (textarea) {
			// Reset height and temporarily hide overflow to get accurate measurement
			textarea.style.height = 'auto'
			textarea.style.overflow = 'hidden'
			textarea.style.height = `${textarea.scrollHeight}px`
			textarea.style.overflow = 'visible'
		}
	}, [content])

	return textareaRef
}
