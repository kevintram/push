import { useNavigate } from '@tanstack/react-router'
import { FileText, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useGlobalSearch } from '~/hooks/useGlobalSearch'
import type { Tables } from '~/types/database.types'
import { highlightText, truncateWithHighlight } from '~/utils/textHighlight'
import { Card, CardContent } from './ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Input } from './ui/Input'

interface SearchDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
	const navigate = useNavigate()
	const inputRef = useRef<HTMLInputElement>(null)
	const [selectedIndex, setSelectedIndex] = useState(0)

	const { query, setQuery, debouncedQuery, results, isLoading, hasQuery } =
		useGlobalSearch()

	useEffect(() => {
		if (open) {
			setTimeout(() => {
				inputRef.current?.focus()
			}, 0)
		} else {
			setQuery('')
			setSelectedIndex(0)
		}
	}, [open, setQuery])

	useEffect(() => {
		setSelectedIndex(0)
	}, [results])

	const handleTopicSelect = (topic: Tables<'topics'>) => {
		navigate({
			to: '/topics/{-$topicId}',
			params: { topicId: topic.id.toString() }
		})
		onOpenChange(false)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!hasQuery || results.length === 0) return

		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
		} else if (e.key === 'Enter') {
			e.preventDefault()
			if (results[selectedIndex]) {
				handleTopicSelect(results[selectedIndex])
			}
		} else if (e.key === 'Escape') {
			onOpenChange(false)
		}
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='p-0 sm:max-w-2xl' showCloseButton={false}>
				<DialogHeader className='p-4 pb-0'>
					<DialogTitle className='sr-only'>Search topics</DialogTitle>
					<div className='relative'>
						<Search className='-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground' />
						<Input
							className='border-0 pl-10 text-lg shadow-none'
							onChange={e => setQuery(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder='Search topics...'
							ref={inputRef}
							value={query}
						/>
					</div>
				</DialogHeader>

				<div className='max-h-80 overflow-y-auto p-4 pt-0'>
					{isLoading && hasQuery && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
							Searching...
						</div>
					)}

					{hasQuery && !isLoading && results.length === 0 && (
						<div className='flex items-center justify-center py-8 text-muted-foreground'>
							No topics found for "{query}"
						</div>
					)}

					{results.length > 0 && (
						<div className='space-y-2'>
							{results.map((topic, index) => (
								<Card
									className={`cursor-pointer gap-0 border-border py-3 shadow-none transition-colors hover:bg-accent ${
										index === selectedIndex
											? 'border-accent-foreground/20 bg-accent'
											: ''
									}`}
									key={topic.id}
									onClick={() => handleTopicSelect(topic)}
									onMouseEnter={() => setSelectedIndex(index)}
								>
									<CardContent className='px-4 py-0'>
										<div className='flex items-start gap-3'>
											<FileText className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
											<div className='min-w-0 flex-1'>
												<div className='line-clamp-1 font-medium'>
													{highlightText({
														text: topic.name || 'Untitled',
														query: debouncedQuery
													})}
												</div>
												{topic.notes && (
													<div className='mt-1 line-clamp-2 text-muted-foreground text-sm'>
														{truncateWithHighlight(
															topic.notes,
															debouncedQuery,
															120
														)}
													</div>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</div>

				<div className='border-t px-4 py-2 text-muted-foreground text-xs'>
					<kbd className='rounded bg-muted px-1.5 py-0.5 text-xs'>↑↓</kbd> to
					navigate
					<kbd className='ml-2 rounded bg-muted px-1.5 py-0.5 text-xs'>↵</kbd>{' '}
					to select
					<kbd className='ml-2 rounded bg-muted px-1.5 py-0.5 text-xs'>esc</kbd>{' '}
					to close
				</div>
			</DialogContent>
		</Dialog>
	)
}
