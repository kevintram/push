import { type LucideProps } from 'lucide-react'
import { forwardRef } from 'react'

export const BookOpenOff = forwardRef<SVGSVGElement, LucideProps>(
	({ color = 'currentColor', size = 24, strokeWidth = 2, ...props }, ref) => (
		<svg
			fill='none'
			height={size}
			ref={ref}
			stroke={color}
			strokeLinecap='round'
			strokeLinejoin='round'
			strokeWidth={strokeWidth}
			viewBox='0 0 24 24'
			width={size}
			xmlns='http://www.w3.org/2000/svg'
			{...props}
		>
			{/* Book spine */}
			<path d='M12 7v14' />
			{/* Open book shape */}
			<path d='M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z' />
			{/* Diagonal "off" line */}
			<line x1='2' x2='22' y1='2' y2='22' />
		</svg>
	),
)

BookOpenOff.displayName = 'BookOpenOff'
