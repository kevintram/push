import { LoadingSpinner } from '~/components/ui/loading-spinner'

interface Properties {
	error?: Error
}

export function LoadingOrError({ error }: Properties) {
	if (!error) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<LoadingSpinner />
			</div>
		)
	}

	return (
		<div className='flex min-h-screen items-center justify-center'>
			<h1 className='text-xl'>{error.message}</h1>
		</div>
	)
}
