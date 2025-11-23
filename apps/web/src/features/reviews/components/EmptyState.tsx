interface EmptyStateProps {
	message: string
}

export function EmptyState({ message }: EmptyStateProps) {
	return (
		<div className='py-12 text-center'>
			<p className='text-muted-foreground'>{message}</p>
		</div>
	)
}
