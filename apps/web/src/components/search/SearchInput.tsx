import { Search, X } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface SearchInputProps {
	/** The current search query value */
	value: string
	/** Callback when the search query changes */
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	/** Callback when clear button is clicked */
	onClear: () => void
	/** Callback for keyboard events (e.g., arrow keys, enter) */
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
	/** Callback when input is focused */
	onFocus?: () => void
	/** Placeholder text */
	placeholder?: string
	/** Ref for the input element */
	inputRef?: React.RefObject<HTMLInputElement | null>
	/** Additional class names for the container */
	className?: string
	/** Additional class names for the input */
	inputClassName?: string
}

export function SearchInput({
	value,
	onChange,
	onClear,
	onKeyDown,
	onFocus,
	placeholder = 'Search topics...',
	inputRef,
	className,
	inputClassName
}: SearchInputProps) {
	return (
		<div className={cn('relative flex-1', className)}>
			<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
			<Input
				className={cn('border-0 px-10 text-lg shadow-none', inputClassName)}
				onChange={onChange}
				onFocus={onFocus}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				ref={inputRef}
				value={value}
			/>
			{value && (
				<button
					className='-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-muted-foreground transition-colors hover:text-foreground'
					onClick={onClear}
					type='button'
				>
					<X className='h-4 w-4' />
				</button>
			)}
		</div>
	)
}
