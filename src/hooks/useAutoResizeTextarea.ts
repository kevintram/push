import { useCallback, useEffect, useRef } from 'react'

/**
 * A hook that automatically resizes a textarea based on its content.
 * @param content - The content value that triggers resize when changed
 * @returns A ref to attach to the textarea element
 */
export function useAutoResizeTextarea(content: string) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (textarea) {
			// Reset height and temporarily hide overflow to get accurate measurement
			textarea.style.height = 'auto'
			textarea.style.overflow = 'hidden'
			textarea.style.height = `${textarea.scrollHeight}px`
			textarea.style.overflow = 'visible'
		}
	}, [])

	// Adjust height when content changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: content is needed to trigger height recalculation on content changes
	useEffect(() => {
		adjustTextareaHeight()
	}, [content, adjustTextareaHeight])

	// Set up ResizeObserver to handle textarea dimension changes
	useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		// Use ResizeObserver to watch for any size changes to the textarea
		// This handles window resize, responsive breakpoints, font loading, etc.
		const resizeObserver = new ResizeObserver(() => {
			adjustTextareaHeight()
		})

		resizeObserver.observe(textarea)

		return () => {
			resizeObserver.disconnect()
		}
	}, [adjustTextareaHeight])

	return textareaRef
}
