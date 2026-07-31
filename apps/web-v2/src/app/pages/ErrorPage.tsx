import type { FallbackProps } from 'react-error-boundary'

export function ErrorPage({ error }: FallbackProps) {
	return (
		<div role='alert'>
			<h1>Something went wrong</h1>
			<pre>{error instanceof Error ? error.message : String(error)}</pre>
		</div>
	)
}
