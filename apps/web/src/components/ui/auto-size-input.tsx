import React, {
	type ComponentProps,
	forwardRef,
	useLayoutEffect,
	useRef
} from "react"
import { cn } from "~/lib/utils"

interface AutoSizeInputProps extends ComponentProps<"input"> {
	value: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	className?: string
}

export const AutoSizeInput = forwardRef<HTMLInputElement, AutoSizeInputProps>(
	({ value, onChange, className, ...props }, ref) => {
		const spanRef = useRef<HTMLSpanElement>(null)
		const inputRef = useRef<HTMLInputElement>(null)

		// Combine refs to support both internal and forwarded refs
		const combinedRef = (element: HTMLInputElement | null) => {
			inputRef.current = element
			if (typeof ref === "function") {
				ref(element)
			} else if (ref) {
				ref.current = element
			}
		}

		// biome-ignore lint/correctness/useExhaustiveDependencies: I WANT VALUE
		useLayoutEffect(() => {
			if (spanRef.current && inputRef.current) {
				inputRef.current.style.width = `${spanRef.current.offsetWidth}px`
			}
		}, [value])

		return (
			<div className='relative flex items-center'>
				<input
					{...props}
					className={cn("border-0 bg-transparent p-0 outline-none", className)}
					onChange={onChange}
					ref={combinedRef}
					value={value}
				/>
				<span
					className='pointer-events-none invisible absolute whitespace-pre'
					ref={spanRef}
				>
					{value || props.placeholder || ""}
				</span>
			</div>
		)
	}
)

AutoSizeInput.displayName = "AutoSizeInput"
