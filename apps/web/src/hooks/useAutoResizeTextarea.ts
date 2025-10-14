import { useCallback, useEffect } from 'react'
import { useResizeObserver } from './useResizeObserver'

/**
 * A hook that automatically resizes a textarea based on its content.
 * @param content - The content value that triggers resize when changed
 * @returns A ref to attach to the textarea element
 */
export function useAutoResizeTextarea(content: string) {
	const [textareaRef] = useResizeObserver<HTMLTextAreaElement>()

	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (textarea) {
			// Reset height and hide overflow to get accurate measurement and prevent scrollbars
			textarea.style.height = 'auto'
			textarea.style.overflow = 'hidden'
			textarea.style.height = `${textarea.scrollHeight}px`
		}
	}, [textareaRef])

	// Adjust height when content changes or dimensions change
	// biome-ignore lint/correctness/useExhaustiveDependencies: content is needed to trigger height recalculation on content changes
	useEffect(() => {
		adjustTextareaHeight()
	}, [content, adjustTextareaHeight])

	return textareaRef
}
